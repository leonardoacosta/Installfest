/**
 * Claude Integration Client
 *
 * Sends test failure notifications to claude-agent-server.
 */

import type {
  TestFailureNotification,
  NotificationResult,
  ClaudeIntegrationConfig,
} from './types';
import { RateLimiter } from './rate-limiter';
import { RetryQueue } from './retry-queue';

export class ClaudeIntegrationClient {
  private config: ClaudeIntegrationConfig;
  private rateLimiter: RateLimiter;
  private retryQueue: RetryQueue<TestFailureNotification>;

  constructor(config: ClaudeIntegrationConfig) {
    this.config = config;
    this.rateLimiter = new RateLimiter(config.rateLimit);
    this.retryQueue = new RetryQueue(
      config.retryAttempts,
      config.retryDelayMs
    );
  }

  /**
   * Send test failure notification
   */
  async notify(
    notification: TestFailureNotification
  ): Promise<NotificationResult> {
    if (!this.config.enabled) {
      return {
        success: false,
        error: 'Claude integration is disabled',
      };
    }

    // Check rate limits
    const rateLimitCheck = this.rateLimiter.canNotify(notification.workflow);
    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        error: rateLimitCheck.reason,
      };
    }

    try {
      const result = await this.sendNotification(notification);

      if (result.success) {
        // Record successful notification
        this.rateLimiter.recordNotification(notification.workflow);

        // Remove from retry queue if it was there
        this.retryQueue.remove(this.getNotificationId(notification));
      } else {
        // Add to retry queue
        this.retryQueue.add(
          this.getNotificationId(notification),
          notification,
          result.error
        );
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // Add to retry queue
      this.retryQueue.add(
        this.getNotificationId(notification),
        notification,
        errorMessage
      );

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Process retry queue
   */
  async processRetryQueue(): Promise<void> {
    const ready = this.retryQueue.getReady();

    for (const item of ready) {
      const result = await this.notify(item.payload);

      if (!result.success && item.attempts >= item.maxAttempts) {
        // Max retries exceeded, remove from queue
        this.retryQueue.remove(item.id);
        console.error(
          `Max retries exceeded for notification ${item.id}:`,
          result.error
        );
      }
    }
  }

  /**
   * Send notification to Claude server
   */
  private async sendNotification(
    notification: TestFailureNotification
  ): Promise<NotificationResult> {
    const url = `${this.config.serverUrl}/api/trpc/testFailures.notify`;

    const payload = {
      workflow: notification.workflow,
      runNumber: notification.runNumber,
      reportId: notification.reportId,
      failures: notification.failures,
      totalTests: notification.totalTests,
      failedTests: notification.failedTests,
      passedTests: notification.passedTests,
      timestamp: notification.timestamp.toISOString(),
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    const data = await response.json() as any;

    return {
      success: true,
      sessionId: data.result?.data?.sessionId,
    };
  }

  /**
   * Generate unique notification ID
   */
  private getNotificationId(notification: TestFailureNotification): string {
    return `${notification.workflow}-${notification.reportId}`;
  }

  /**
   * Get statistics
   */
  getStats(): {
    rateLimiter: ReturnType<RateLimiter['getStats']>;
    retryQueue: ReturnType<RetryQueue<TestFailureNotification>['getStats']>;
  } {
    return {
      rateLimiter: this.rateLimiter.getStats(),
      retryQueue: this.retryQueue.getStats(),
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; error?: string }> {
    if (!this.config.enabled) {
      return { healthy: false, error: 'Integration disabled' };
    }

    try {
      const response = await fetch(`${this.config.serverUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        return {
          healthy: false,
          error: `HTTP ${response.status}`,
        };
      }

      return { healthy: true };
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
