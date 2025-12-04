import { SpecLifecycleService } from './spec-lifecycle';

/**
 * Background job that monitors specs for automatic transitions
 * Runs every 30 seconds to check if specs should auto-transition
 */
export class LifecycleMonitor {
  private lifecycleService: SpecLifecycleService;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor() {
    this.lifecycleService = new SpecLifecycleService();
  }

  /**
   * Start the background monitoring job
   */
  start(intervalMs = 30000): void {
    if (this.isRunning) {
      console.log('Lifecycle monitor is already running');
      return;
    }

    console.log(`Starting lifecycle monitor (interval: ${intervalMs}ms)`);

    this.isRunning = true;

    // Run immediately on start
    this.checkTransitions().catch(console.error);

    // Then run on interval
    this.intervalId = setInterval(() => {
      this.checkTransitions().catch(console.error);
    }, intervalMs);
  }

  /**
   * Stop the background monitoring job
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('Lifecycle monitor is not running');
      return;
    }

    console.log('Stopping lifecycle monitor');

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
  }

  /**
   * Check all specs for automatic transitions
   */
  private async checkTransitions(): Promise<void> {
    try {
      console.log('[Lifecycle Monitor] Checking for automatic transitions...');

      await this.lifecycleService.triggerAutomaticTransitions();

      console.log('[Lifecycle Monitor] Check complete');
    } catch (error) {
      console.error('[Lifecycle Monitor] Error checking transitions:', error);
      // Don't crash the job, continue running
    }
  }

  /**
   * Get monitoring status
   */
  getStatus(): { isRunning: boolean; intervalMs: number | null } {
    return {
      isRunning: this.isRunning,
      intervalMs: this.intervalId ? 30000 : null,
    };
  }
}

// Singleton instance
let monitorInstance: LifecycleMonitor | null = null;

/**
 * Get or create the lifecycle monitor singleton
 */
export function getLifecycleMonitor(): LifecycleMonitor {
  if (!monitorInstance) {
    monitorInstance = new LifecycleMonitor();
  }

  return monitorInstance;
}

/**
 * Start the lifecycle monitor (called from app initialization)
 */
export function startLifecycleMonitor(intervalMs = 30000): void {
  const monitor = getLifecycleMonitor();
  monitor.start(intervalMs);
}

/**
 * Stop the lifecycle monitor (called from app shutdown)
 */
export function stopLifecycleMonitor(): void {
  const monitor = getLifecycleMonitor();
  monitor.stop();
}
