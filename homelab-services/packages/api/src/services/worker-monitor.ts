import { eq, and, desc, sql, gte } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { workerAgents, hooks, sessions, openspecSpecs } from '@homelab/db';
import type { WorkerAgentProgress } from '@homelab/validators';
import { SpecLifecycleService } from './spec-lifecycle';
import { WorkerAgentService } from './worker-agent';
import { workerEvents } from '../events';

/**
 * Worker progress metrics from hook analysis
 */
interface ProgressMetrics {
  toolsExecuted: number;
  successRate: number;
  filesChanged: string[];
  testsRun: number;
  testsPassed: number | null;
  elapsedMs: number;
  taskCompletion: {
    completed: number;
    total: number;
    percentage: number;
  };
  lastActivityAt: Date | null;
  currentTool: string | null;
}

/**
 * Worker Monitoring Service
 * Tracks worker progress via hooks and detects completion/failure
 */
export class WorkerMonitorService {
  constructor(private db: LibSQLDatabase<any>) {}

  /**
   * Monitor a worker and update its status based on hook activity
   * Called periodically for active workers
   */
  async monitorWorker(workerId: string): Promise<void> {
    const worker = await this.db
      .select()
      .from(workerAgents)
      .where(eq(workerAgents.id, workerId))
      .get();

    if (!worker) {
      throw new Error(`Worker ${workerId} not found`);
    }

    // Skip if already terminal state
    if (['completed', 'failed', 'cancelled'].includes(worker.status)) {
      return;
    }

    // Get session for this worker (worker.id is the session's agentId)
    const session = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.id, worker.sessionId))
      .get();

    if (!session) {
      console.warn(`[WorkerMonitor] Session ${worker.sessionId} not found for worker ${workerId}`);
      return;
    }

    // Get hooks for this session
    const workerHooks = await this.db
      .select()
      .from(hooks)
      .where(eq(hooks.sessionId, session.id))
      .orderBy(desc(hooks.timestamp))
      .limit(100)
      .all();

    // If worker is 'spawned' and has hooks, transition to 'active'
    if (worker.status === 'spawned' && workerHooks.length > 0) {
      const startedAt = workerHooks[workerHooks.length - 1]?.timestamp ?? new Date();

      await this.db
        .update(workerAgents)
        .set({
          status: 'active',
          startedAt,
        })
        .where(eq(workerAgents.id, workerId));

      console.log('[WorkerMonitor] Worker started', { workerId });

      workerEvents.emit('worker:event', {
        event: 'worker_started',
        workerId,
        status: 'active',
        timestamp: startedAt,
        data: { sessionId: worker.sessionId, specId: worker.specId }
      });
    }

    // Check for completion
    const isComplete = await this.detectCompletion(workerId, workerHooks);
    if (isComplete) {
      return; // Already updated in detectCompletion
    }

    // Check for failure
    const isFailed = await this.detectFailure(workerId, workerHooks);
    if (isFailed) {
      return; // Already updated in detectFailure
    }

    // Update last activity timestamp
    if (workerHooks.length > 0) {
      const latestHook = workerHooks[0];
      await this.db
        .update(sessions)
        .set({ lastActivityAt: latestHook?.timestamp })
        .where(eq(sessions.id, session.id));
    }
  }

  /**
   * Get detailed progress metrics for a worker
   */
  async getProgress(workerId: string): Promise<WorkerAgentProgress> {
    const worker = await this.db
      .select()
      .from(workerAgents)
      .where(eq(workerAgents.id, workerId))
      .get();

    if (!worker) {
      throw new Error(`Worker ${workerId} not found`);
    }

    // Get session
    const session = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.id, worker.sessionId))
      .get();

    if (!session) {
      throw new Error(`Session ${worker.sessionId} not found`);
    }

    // Get hooks for progress calculation
    const workerHooks = await this.db
      .select()
      .from(hooks)
      .where(eq(hooks.sessionId, session.id))
      .orderBy(desc(hooks.timestamp))
      .all();

    const metrics = this.calculateProgressMetrics(worker, workerHooks);

    return {
      workerId: worker.id,
      status: worker.status as any,
      ...metrics,
    };
  }

  /**
   * Calculate progress metrics from hooks
   */
  private calculateProgressMetrics(
    worker: typeof workerAgents.$inferSelect,
    workerHooks: Array<typeof hooks.$inferSelect>
  ): Omit<ProgressMetrics, 'taskCompletion'> & { taskCompletion: { completed: number; total: number; percentage: number } } {
    // Tools executed
    const toolsExecuted = workerHooks.length;

    // Success rate
    const successfulTools = workerHooks.filter(h => h.success === true).length;
    const successRate = toolsExecuted > 0 ? (successfulTools / toolsExecuted) * 100 : 0;

    // Files changed (from Edit/Write tools)
    const filesChanged: string[] = [];
    for (const hook of workerHooks) {
      if (hook.toolName === 'Edit' || hook.toolName === 'Write') {
        try {
          const input = JSON.parse(hook.toolInput ?? '{}');
          if (input.file_path && !filesChanged.includes(input.file_path)) {
            filesChanged.push(input.file_path);
          }
        } catch {
          // Ignore parse errors
        }
      }
    }

    // Tests run (detect Bash tool with test patterns)
    let testsRun = 0;
    let testsPassed: number | null = null;
    for (const hook of workerHooks) {
      if (hook.toolName === 'Bash') {
        try {
          const input = JSON.parse(hook.toolInput ?? '{}');
          const command = input.command ?? '';
          if (
            command.includes('test') ||
            command.includes('vitest') ||
            command.includes('jest') ||
            command.includes('playwright')
          ) {
            testsRun++;
            if (hook.success) {
              testsPassed = (testsPassed ?? 0) + 1;
            }
          }
        } catch {
          // Ignore parse errors
        }
      }
    }

    // Elapsed time
    const startTime = worker.startedAt ?? worker.spawnedAt;
    const endTime = worker.completedAt ?? new Date();
    const elapsedMs = endTime.getTime() - startTime.getTime();

    // Task completion - would need to parse tasks.md from spec
    // For now, return placeholder
    const taskCompletion = {
      completed: 0,
      total: 1,
      percentage: 0,
    };

    // Last activity
    const lastActivityAt = workerHooks[0]?.timestamp ?? null;

    // Current tool (latest hook)
    const currentTool = workerHooks[0]?.toolName ?? null;

    return {
      toolsExecuted,
      successRate,
      filesChanged,
      testsRun,
      testsPassed,
      elapsedMs,
      taskCompletion,
      lastActivityAt,
      currentTool,
    };
  }

  /**
   * Detect if worker has completed
   */
  async detectCompletion(
    workerId: string,
    workerHooks: Array<typeof hooks.$inferSelect>
  ): Promise<boolean> {
    if (workerHooks.length === 0) {
      return false;
    }

    const latestHook = workerHooks[0];
    if (!latestHook) return false;

    // Check for completion signal in latest hook output
    const hasCompletionSignal = this.hasCompletionSignal(latestHook);

    // Check for idle time (10+ min with no activity)
    const idleTimeMs = Date.now() - (latestHook.timestamp?.getTime() ?? Date.now());
    const isIdle = idleTimeMs > 10 * 60 * 1000; // 10 minutes

    // TODO: Parse tasks.md to check if all tasks are [x]
    // For now, rely on completion signal or manual completion

    if (hasCompletionSignal) {
      // Get worker to find spec
      const worker = await this.db
        .select()
        .from(workerAgents)
        .where(eq(workerAgents.id, workerId))
        .get();

      if (!worker) {
        console.error('[WorkerMonitor] Worker not found for completion', { workerId });
        return false;
      }

      // Update worker status
      await this.db
        .update(workerAgents)
        .set({
          status: 'completed',
          completedAt: new Date(),
        })
        .where(eq(workerAgents.id, workerId));

      console.log('[WorkerMonitor] Worker completed', { workerId, specId: worker.specId });

      // Transition spec to review status
      try {
        const lifecycleService = new SpecLifecycleService();
        const currentState = await lifecycleService.getCurrentState(worker.specId);

        // Transition from assigned -> in_progress if needed
        if (currentState === 'assigned') {
          await lifecycleService.transitionState(
            worker.specId,
            'in_progress',
            'system',
            'Worker started implementation',
            undefined,
            worker.sessionId
          );
        }

        // Transition to review
        await lifecycleService.transitionState(
          worker.specId,
          'review',
          'system',
          'Worker completed all tasks',
          undefined,
          worker.sessionId
        );

        console.log('[WorkerMonitor] Spec transitioned to review', { specId: worker.specId });
      } catch (error) {
        console.error('[WorkerMonitor] Failed to transition spec', {
          specId: worker.specId,
          error,
        });
      }

      workerEvents.emit('worker:event', {
        event: 'worker_completed',
        workerId,
        status: 'completed',
        timestamp: new Date(),
        data: {
          specId: worker.specId,
          sessionId: worker.sessionId,
          transitionedToReview: true
        }
      });

      return true;
    }

    return false;
  }

  /**
   * Detect if worker has failed
   */
  async detectFailure(
    workerId: string,
    workerHooks: Array<typeof hooks.$inferSelect>
  ): Promise<boolean> {
    if (workerHooks.length === 0) {
      return false;
    }

    const latestHook = workerHooks[0];
    if (!latestHook) return false;

    // Check if latest hook failed with error
    if (latestHook.success === false && latestHook.errorMessage) {
      await this.handleWorkerFailure(workerId, latestHook.errorMessage);
      return true;
    }

    // Check for timeout (20+ min with no activity)
    const idleTimeMs = Date.now() - (latestHook.timestamp?.getTime() ?? Date.now());
    const isTimeout = idleTimeMs > 20 * 60 * 1000; // 20 minutes

    if (isTimeout) {
      await this.handleWorkerFailure(
        workerId,
        'Worker timed out after 20 minutes of inactivity'
      );
      return true;
    }

    return false;
  }

  /**
   * Handle worker failure - update status and trigger retry
   */
  private async handleWorkerFailure(workerId: string, errorMessage: string): Promise<void> {
    // Update worker status
    await this.db
      .update(workerAgents)
      .set({
        status: 'failed',
        completedAt: new Date(),
        errorMessage,
      })
      .where(eq(workerAgents.id, workerId));

    console.log('[WorkerMonitor] Worker failed', { workerId, errorMessage });

    workerEvents.emit('worker:event', {
      event: 'worker_failed',
      workerId,
      status: 'failed',
      timestamp: new Date(),
      data: { errorMessage }
    });

    // Attempt automatic retry
    try {
      const workerService = new WorkerAgentService(this.db, { mockMode: true });
      const retryWorker = await workerService.retryWorker(workerId);

      if (retryWorker) {
        console.log('[WorkerMonitor] Automatic retry spawned', {
          originalWorkerId: workerId,
          retryWorkerId: retryWorker.id,
          retryCount: retryWorker.retryCount,
        });
      } else {
        console.warn('[WorkerMonitor] Retry limit exhausted - manual intervention required', {
          workerId,
        });
        // TODO: Create clarification request in dashboard
      }
    } catch (error) {
      console.error('[WorkerMonitor] Failed to retry worker', { workerId, error });
    }
  }

  /**
   * Check if a hook contains a completion signal
   */
  private hasCompletionSignal(hook: typeof hooks.$inferSelect): boolean {
    const output = hook.toolOutput?.toLowerCase() ?? '';
    const completionPhrases = [
      'all tasks complete',
      'implementation complete',
      'work complete',
      'finished all tasks',
      'completed all tasks',
    ];

    return completionPhrases.some(phrase => output.includes(phrase));
  }

  /**
   * Get hook timeline for a worker
   */
  async getHookTimeline(
    workerId: string,
    limit = 50
  ): Promise<Array<typeof hooks.$inferSelect>> {
    const worker = await this.db
      .select()
      .from(workerAgents)
      .where(eq(workerAgents.id, workerId))
      .get();

    if (!worker) {
      throw new Error(`Worker ${workerId} not found`);
    }

    const session = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.id, worker.sessionId))
      .get();

    if (!session) {
      throw new Error(`Session ${worker.sessionId} not found`);
    }

    return this.db
      .select()
      .from(hooks)
      .where(eq(hooks.sessionId, session.id))
      .orderBy(desc(hooks.timestamp))
      .limit(limit)
      .all();
  }
}
