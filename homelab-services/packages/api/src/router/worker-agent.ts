/**
 * Worker Agent Router
 *
 * Handles worker agent spawning, monitoring, and management.
 */

import { z } from 'zod';
import { observable } from '@trpc/server/observable';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { WorkerAgentService } from '../services/worker-agent';
import { WorkerMonitorService } from '../services/worker-monitor';
import {
  workerAgentConfigSchema,
  workerIdSchema,
  workerRetrySchema,
  workerAgentFilterSchema,
  workerHookTimelineSchema,
} from '@homelab/validators';

export const workerAgentRouter = createTRPCRouter({
  /**
   * Spawn a new worker agent
   */
  spawn: publicProcedure
    .input(workerAgentConfigSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new WorkerAgentService(ctx.db, { mockMode: true });
      const worker = await service.spawnWorker(input);
      return worker;
    }),

  /**
   * Get worker status
   */
  getStatus: publicProcedure
    .input(workerIdSchema)
    .query(async ({ ctx, input }) => {
      const service = new WorkerAgentService(ctx.db);
      const worker = await service.getWorkerStatus(input.workerId);

      if (!worker) {
        throw new Error(`Worker ${input.workerId} not found`);
      }

      return {
        id: worker.id,
        sessionId: worker.sessionId,
        specId: worker.specId,
        agentType: worker.agentType,
        status: worker.status,
        spawnedAt: worker.spawnedAt,
        startedAt: worker.startedAt,
        completedAt: worker.completedAt,
        retryCount: worker.retryCount,
        errorMessage: worker.errorMessage,
      };
    }),

  /**
   * Get detailed progress metrics
   */
  getProgress: publicProcedure
    .input(workerIdSchema)
    .query(async ({ ctx, input }) => {
      const monitorService = new WorkerMonitorService(ctx.db);
      const progress = await monitorService.getProgress(input.workerId);
      return progress;
    }),

  /**
   * List active workers
   */
  listActive: publicProcedure
    .input(workerAgentFilterSchema.optional())
    .query(async ({ ctx, input }) => {
      const service = new WorkerAgentService(ctx.db);
      const workers = await service.listActive(input ?? {});
      return workers;
    }),

  /**
   * Get hook timeline for a worker
   */
  getHookTimeline: publicProcedure
    .input(workerHookTimelineSchema)
    .query(async ({ ctx, input }) => {
      const monitorService = new WorkerMonitorService(ctx.db);
      const hooks = await monitorService.getHookTimeline(
        input.workerId,
        input.limit
      );

      return hooks.map(hook => ({
        hookId: hook.id,
        timestamp: hook.timestamp,
        toolName: hook.toolName ?? '',
        success: hook.success ?? false,
        durationMs: hook.durationMs ?? 0,
        errorMessage: hook.errorMessage,
      }));
    }),

  /**
   * Cancel a worker
   */
  cancel: publicProcedure
    .input(workerIdSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new WorkerAgentService(ctx.db);
      const updated = await service.cancelWorker(input.workerId);
      return updated;
    }),

  /**
   * Retry a failed worker
   */
  retry: publicProcedure
    .input(workerRetrySchema)
    .mutation(async ({ ctx, input }) => {
      const service = new WorkerAgentService(ctx.db, { mockMode: true });
      const newWorker = await service.retryWorker(
        input.workerId,
        input.forceAgentType
      );

      if (!newWorker) {
        throw new Error('Retry limit exceeded - manual intervention required');
      }

      return newWorker;
    }),

  /**
   * Subscribe to worker events
   * Streams: worker_spawned, worker_started, worker_progress, worker_completed, worker_failed
   */
  subscribe: publicProcedure
    .input(
      z.object({
        sessionId: z.number().int().positive().optional(),
        specId: z.string().optional(),
        projectId: z.number().int().positive().optional(),
      })
    )
    .subscription(({ input }) => {
      return observable<{
        event: 'worker_spawned' | 'worker_started' | 'worker_progress' | 'worker_completed' | 'worker_failed';
        workerId: string;
        status: string;
        timestamp: Date;
        data?: any;
      }>((emit) => {
        // TODO: Implement real-time subscription using EventEmitter or similar
        // For now, this is a placeholder that would need to be wired to
        // the actual worker monitoring system

        console.log('[WorkerAgent] Subscription started', input);

        // Cleanup function
        return () => {
          console.log('[WorkerAgent] Subscription ended', input);
        };
      });
    }),
});
