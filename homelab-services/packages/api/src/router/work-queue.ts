/**
 * Work Queue Router
 *
 * Handles work queue management for OpenSpec items
 */

import { z } from 'zod';
import { observable } from '@trpc/server/observable';
import { createTRPCRouter, publicProcedure } from '../trpc';
import {
  workQueueFilterSchema,
  workQueueReorderSchema,
  addWorkItemSchema,
  assignWorkItemSchema,
  blockWorkItemSchema,
} from '@homelab/validators';
import { WorkQueueService } from '../services/work-queue';
import { EventEmitter } from 'events';

// Event emitter for work queue updates
const workQueueEvents = new EventEmitter();

export const workQueueRouter = createTRPCRouter({
  /**
   * Get work queue for a project
   */
  getQueue: publicProcedure
    .input(
      z.object({
        projectId: z.number(),
        filter: workQueueFilterSchema.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const service = new WorkQueueService(ctx.db);
      return service.getQueue(input.projectId, input.filter);
    }),

  /**
   * Get work queue statistics
   */
  stats: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const service = new WorkQueueService(ctx.db);
      return service.getStats(input.projectId);
    }),

  /**
   * Add item to work queue
   */
  add: publicProcedure
    .input(addWorkItemSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new WorkQueueService(ctx.db);
      const item = await service.addToQueue(
        input.projectId,
        input.specId,
        input.priority
      );

      // Emit event for subscriptions
      workQueueEvents.emit('item_added', {
        type: 'item_added',
        projectId: input.projectId,
        workItemId: item.id,
        item,
      });

      return item;
    }),

  /**
   * Reorder work queue
   */
  reorder: publicProcedure
    .input(workQueueReorderSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new WorkQueueService(ctx.db);
      await service.reorderQueue(input.projectId, input.newOrder);

      // Emit event for subscriptions
      workQueueEvents.emit('item_reordered', {
        type: 'item_reordered',
        projectId: input.projectId,
        newOrder: input.newOrder,
      });

      // Return updated queue
      return service.getQueue(input.projectId);
    }),

  /**
   * Assign work item to session
   */
  assign: publicProcedure
    .input(assignWorkItemSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new WorkQueueService(ctx.db);
      await service.assignWorkItem(input.workItemId, input.sessionId);

      // Emit event for subscriptions
      workQueueEvents.emit('status_changed', {
        type: 'status_changed',
        workItemId: input.workItemId,
        status: 'assigned',
        sessionId: input.sessionId,
      });

      return { success: true };
    }),

  /**
   * Complete work item
   */
  complete: publicProcedure
    .input(z.object({ workItemId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const service = new WorkQueueService(ctx.db);
      await service.completeWorkItem(input.workItemId);

      // Emit event for subscriptions
      workQueueEvents.emit('status_changed', {
        type: 'status_changed',
        workItemId: input.workItemId,
        status: 'completed',
      });

      return { success: true };
    }),

  /**
   * Block work item with dependency
   */
  block: publicProcedure
    .input(blockWorkItemSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new WorkQueueService(ctx.db);
      await service.blockWorkItem(input.workItemId, input.blockedBySpecId);

      // Emit event for subscriptions
      workQueueEvents.emit('status_changed', {
        type: 'status_changed',
        workItemId: input.workItemId,
        status: 'blocked',
        blockedBy: input.blockedBySpecId,
      });

      return { success: true };
    }),

  /**
   * Unblock work item
   */
  unblock: publicProcedure
    .input(z.object({ workItemId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const service = new WorkQueueService(ctx.db);
      await service.unblockWorkItem(input.workItemId);

      // Emit event for subscriptions
      workQueueEvents.emit('status_changed', {
        type: 'status_changed',
        workItemId: input.workItemId,
        status: 'queued',
      });

      return { success: true };
    }),

  /**
   * Remove item from queue
   */
  remove: publicProcedure
    .input(z.object({ workItemId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const service = new WorkQueueService(ctx.db);
      await service.removeFromQueue(input.workItemId);

      // Emit event for subscriptions
      workQueueEvents.emit('item_removed', {
        type: 'item_removed',
        workItemId: input.workItemId,
      });

      return { success: true };
    }),

  /**
   * Subscribe to work queue changes
   */
  subscribe: publicProcedure
    .input(z.object({ projectId: z.number().optional() }))
    .subscription(({ input }) => {
      return observable<any>((emit) => {
        // Event handlers
        const onItemAdded = (data: any) => {
          if (!input.projectId || data.projectId === input.projectId) {
            emit.next(data);
          }
        };

        const onItemRemoved = (data: any) => {
          emit.next(data);
        };

        const onItemReordered = (data: any) => {
          if (!input.projectId || data.projectId === input.projectId) {
            emit.next(data);
          }
        };

        const onStatusChanged = (data: any) => {
          emit.next(data);
        };

        // Register event listeners
        workQueueEvents.on('item_added', onItemAdded);
        workQueueEvents.on('item_removed', onItemRemoved);
        workQueueEvents.on('item_reordered', onItemReordered);
        workQueueEvents.on('status_changed', onStatusChanged);

        // Cleanup on unsubscribe
        return () => {
          workQueueEvents.off('item_added', onItemAdded);
          workQueueEvents.off('item_removed', onItemRemoved);
          workQueueEvents.off('item_reordered', onItemReordered);
          workQueueEvents.off('status_changed', onStatusChanged);
        };
      });
    }),
});

// Export event emitter for use in other services
export { workQueueEvents };
