import cron from 'node-cron';
import type { OpenSpecSyncService } from './openspec-sync';

/**
 * Configuration for sync scheduler
 */
export interface SyncSchedulerConfig {
  schedule?: string; // Cron expression, default: every 30 seconds
  batchSize?: number; // Max specs to sync per run, default: 50
}

/**
 * Periodic sync scheduler
 * Runs batch sync for stale specs every 30 seconds
 */
export class SyncScheduler {
  private task: cron.ScheduledTask | null = null;
  private syncServices: Map<number, OpenSpecSyncService> = new Map();
  private config: SyncSchedulerConfig;

  constructor(config: SyncSchedulerConfig = {}) {
    this.config = {
      schedule: '*/30 * * * * *', // Every 30 seconds
      batchSize: 50,
      ...config,
    };
  }

  /**
   * Register a sync service for a project
   */
  registerProject(projectId: number, syncService: OpenSpecSyncService): void {
    this.syncServices.set(projectId, syncService);
    console.log(`[SyncScheduler] Registered project ${projectId} for periodic sync`);
  }

  /**
   * Unregister a sync service
   */
  unregisterProject(projectId: number): void {
    this.syncServices.delete(projectId);
    console.log(`[SyncScheduler] Unregistered project ${projectId} from periodic sync`);
  }

  /**
   * Start the periodic sync scheduler
   */
  start(): void {
    if (this.task) {
      console.log('[SyncScheduler] Scheduler already running');
      return;
    }

    console.log(`[SyncScheduler] Starting periodic sync (schedule: ${this.config.schedule})`);

    this.task = cron.schedule(this.config.schedule, async () => {
      await this.runSync();
    });
  }

  /**
   * Stop the periodic sync scheduler
   */
  stop(): void {
    if (this.task) {
      console.log('[SyncScheduler] Stopping periodic sync');
      this.task.stop();
      this.task = null;
    }
  }

  /**
   * Run periodic sync for all registered projects
   */
  private async runSync(): Promise<void> {
    if (this.syncServices.size === 0) {
      return;
    }

    console.log(`[SyncScheduler] Running periodic sync for ${this.syncServices.size} projects`);

    const startTime = Date.now();
    let totalSynced = 0;
    let totalErrors = 0;

    // Process each project
    for (const [projectId, syncService] of this.syncServices.entries()) {
      try {
        // Get stale specs for this project
        const staleSpecs = await syncService.getStaleSpecs();

        if (staleSpecs.length === 0) {
          continue;
        }

        // Limit batch size
        const specsToSync = staleSpecs.slice(0, this.config.batchSize!);

        console.log(
          `[SyncScheduler] Project ${projectId}: Syncing ${specsToSync.length} stale specs`
        );

        // Batch sync
        await syncService.syncBatch(specsToSync);

        totalSynced += specsToSync.length;
      } catch (error) {
        totalErrors++;
        console.error(
          `[SyncScheduler] Error syncing project ${projectId}:`,
          error
        );
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `[SyncScheduler] Periodic sync completed: ${totalSynced} specs synced, ${totalErrors} errors, ${duration}ms`
    );
  }

  /**
   * Manually trigger sync (bypass schedule)
   */
  async forceSyncAll(): Promise<void> {
    console.log('[SyncScheduler] Forcing immediate sync for all projects');
    await this.runSync();
  }

  /**
   * Manually trigger sync for specific project
   */
  async forceSyncProject(projectId: number): Promise<void> {
    const syncService = this.syncServices.get(projectId);
    if (!syncService) {
      throw new Error(`Project ${projectId} not registered`);
    }

    console.log(`[SyncScheduler] Forcing immediate sync for project ${projectId}`);

    const staleSpecs = await syncService.getStaleSpecs();
    if (staleSpecs.length === 0) {
      console.log(`[SyncScheduler] No stale specs for project ${projectId}`);
      return;
    }

    await syncService.syncBatch(staleSpecs);
    console.log(
      `[SyncScheduler] Synced ${staleSpecs.length} specs for project ${projectId}`
    );
  }

  /**
   * Check if scheduler is running
   */
  isRunning(): boolean {
    return this.task !== null;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      isRunning: this.isRunning(),
      projectCount: this.syncServices.size,
      schedule: this.config.schedule,
      batchSize: this.config.batchSize,
    };
  }
}
