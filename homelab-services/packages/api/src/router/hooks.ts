/**
 * Hooks Router
 *
 * Handles Claude agent hook execution tracking and statistics.
 */

import { z } from 'zod'
import { eq, desc, count, avg, sum, sql } from 'drizzle-orm'
import { observable } from '@trpc/server/observable'
import { createTRPCRouter, publicProcedure } from '../trpc'
import { hooks, sessions, projects } from '@homelab/db'
import {
  ingestHookSchema,
  hookFilterSchema
} from '@homelab/validators'
import { hookEvents } from '../events'
import { SessionMonitorService } from '../services/session-monitor'

export const hooksRouter = createTRPCRouter({
  // List hooks with filtering
  list: publicProcedure
    .input(hookFilterSchema.optional())
    .query(async ({ ctx, input }) => {
      const { sessionId, limit = 50, offset: queryOffset = 0 } = input || {}

      if (sessionId) {
        return ctx.db
          .select()
          .from(hooks)
          .where(eq(hooks.sessionId, sessionId))
          .orderBy(desc(hooks.timestamp))
          .limit(limit)
          .offset(queryOffset)
      }

      return ctx.db
        .select({
          id: hooks.id,
          sessionId: hooks.sessionId,
          hookType: hooks.hookType,
          timestamp: hooks.timestamp,
          toolName: hooks.toolName,
          toolInput: hooks.toolInput,
          toolOutput: hooks.toolOutput,
          durationMs: hooks.durationMs,
          success: hooks.success,
          errorMessage: hooks.errorMessage,
          metadata: hooks.metadata,
          agentId: sessions.agentId,
          projectName: projects.name,
        })
        .from(hooks)
        .leftJoin(sessions, eq(hooks.sessionId, sessions.id))
        .leftJoin(projects, eq(sessions.projectId, projects.id))
        .orderBy(desc(hooks.timestamp))
        .limit(limit)
        .offset(queryOffset)
    }),

  // Get hook statistics
  stats: publicProcedure
    .input(
      z
        .object({
          sessionId: z.number().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const { sessionId } = input || {}

      const baseQuery = ctx.db
        .select({
          total: count(),
          successful: sum(
            sql<number>`CASE WHEN ${hooks.success} = 1 THEN 1 ELSE 0 END`
          ),
          failed: sum(
            sql<number>`CASE WHEN ${hooks.success} = 0 THEN 1 ELSE 0 END`
          ),
          avgDuration: avg(hooks.durationMs),
          hookType: hooks.hookType,
          toolName: hooks.toolName,
        })
        .from(hooks)
        .groupBy(hooks.hookType, hooks.toolName)

      if (sessionId) {
        return baseQuery.where(eq(hooks.sessionId, sessionId))
      }

      return baseQuery
    }),

  // Create hook record (ingest from Python scripts)
  ingest: publicProcedure
    .input(ingestHookSchema)
    .mutation(async ({ ctx, input }) => {
      const [hook] = await ctx.db
        .insert(hooks)
        .values({
          sessionId: input.sessionId,
          hookType: input.hookType,
          toolName: input.toolName,
          toolInput: input.toolInput,
          toolOutput: input.toolOutput,
          durationMs: input.durationMs,
          success: input.success,
          errorMessage: input.errorMessage,
          metadata: input.metadata,
        })
        .returning()

      // Update session activity timestamp
      const sessionMonitor = new SessionMonitorService(ctx.db);
      try {
        await sessionMonitor.updateSessionActivity(input.sessionId);
      } catch (error) {
        console.error(`Failed to update session activity for session ${input.sessionId}:`, error);
        // Don't fail the hook ingest if activity update fails
      }

      // Broadcast event to subscribed clients
      hookEvents.emit('hook:created', hook)

      return hook
    }),

  // Subscribe to real-time hook events
  subscribe: publicProcedure
    .input(
      z
        .object({
          sessionId: z.number().optional(),
        })
        .optional()
    )
    .subscription(({ input }) => {
      return observable<typeof hooks.$inferSelect>((emit) => {
        const { sessionId } = input || {}

        // Event handler - filter by sessionId if provided
        const onHookCreated = (hook: typeof hooks.$inferSelect) => {
          if (!sessionId || hook.sessionId === sessionId) {
            emit.next(hook)
          }
        }

        // Subscribe to hook events
        hookEvents.on('hook:created', onHookCreated)

        // Cleanup on unsubscribe
        return () => {
          hookEvents.off('hook:created', onHookCreated)
        }
      })
    }),
})
