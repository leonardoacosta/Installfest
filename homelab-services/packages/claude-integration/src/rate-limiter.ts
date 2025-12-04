/**
 * Rate Limiter
 *
 * Tracks notification counts per workflow and globally to prevent spam.
 */

export interface RateLimiterConfig {
  perWorkflow: number; // Max per workflow per hour
  global: number; // Max total per hour
}

interface NotificationRecord {
  workflow: string;
  timestamp: number;
}

export class RateLimiter {
  private notifications: NotificationRecord[] = [];
  private config: RateLimiterConfig;

  constructor(config: RateLimiterConfig) {
    this.config = config;
  }

  /**
   * Check if a notification can be sent
   */
  canNotify(workflow: string): { allowed: boolean; reason?: string } {
    this.cleanup();

    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    // Check global limit
    const recentNotifications = this.notifications.filter(
      (n) => n.timestamp > oneHourAgo
    );

    if (recentNotifications.length >= this.config.global) {
      return {
        allowed: false,
        reason: `Global rate limit exceeded (${this.config.global} per hour)`,
      };
    }

    // Check per-workflow limit
    const workflowNotifications = recentNotifications.filter(
      (n) => n.workflow === workflow
    );

    if (workflowNotifications.length >= this.config.perWorkflow) {
      return {
        allowed: false,
        reason: `Workflow rate limit exceeded (${this.config.perWorkflow} per hour for ${workflow})`,
      };
    }

    return { allowed: true };
  }

  /**
   * Record a notification
   */
  recordNotification(workflow: string): void {
    this.notifications.push({
      workflow,
      timestamp: Date.now(),
    });
  }

  /**
   * Clean up old notifications (> 1 hour old)
   */
  private cleanup(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    this.notifications = this.notifications.filter(
      (n) => n.timestamp > oneHourAgo
    );
  }

  /**
   * Get current statistics
   */
  getStats(): {
    total: number;
    byWorkflow: Record<string, number>;
  } {
    this.cleanup();

    const byWorkflow: Record<string, number> = {};
    for (const notification of this.notifications) {
      byWorkflow[notification.workflow] =
        (byWorkflow[notification.workflow] || 0) + 1;
    }

    return {
      total: this.notifications.length,
      byWorkflow,
    };
  }

  /**
   * Reset all rate limits (for testing)
   */
  reset(): void {
    this.notifications = [];
  }
}
