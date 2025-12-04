/**
 * Sessions Router
 *
 * Handles Claude agent development sessions.
 */

import { eq, desc, count, sql } from 'drizzle-orm'
import { createTRPCRouter, publicProcedure } from '../trpc'
import { sessions, projects, hooks } from '@homelab/db'
import {
  createSessionSchema,
  sessionIdSchema,
  sessionFilterSchema
} from '@homelab/validators'

export const sessionsRouter = createTRPCRouter({
  // List all sessions
  list: publicProcedure
    .input(sessionFilterSchema.optional())
    .query(async ({ ctx, input }) => {
      const { projectId, limit = 50 } = input || {}

      const query = ctx.db
        .select({
          id: sessions.id,
          projectId: sessions.projectId,
          agentId: sessions.agentId,
          status: sessions.status,
          startedAt: sessions.startedAt,
          stoppedAt: sessions.stoppedAt,
          errorMessage: sessions.errorMessage,
          projectName: projects.name,
        })
        .from(sessions)
        .leftJoin(projects, eq(sessions.projectId, projects.id))
        .orderBy(desc(sessions.startedAt))
        .limit(limit)

      if (projectId) {
        return query.where(eq(sessions.projectId, projectId))
      }

      return query
    }),

  // Get session by ID with hook count
  byId: publicProcedure
    .input(sessionIdSchema)
    .query(async ({ ctx, input }) => {
      const session = await ctx.db
        .select({
          id: sessions.id,
          projectId: sessions.projectId,
          agentId: sessions.agentId,
          status: sessions.status,
          startedAt: sessions.startedAt,
          stoppedAt: sessions.stoppedAt,
          errorMessage: sessions.errorMessage,
          projectName: projects.name,
        })
        .from(sessions)
        .leftJoin(projects, eq(sessions.projectId, projects.id))
        .where(eq(sessions.id, input.id))
        .get()

      if (!session) {
        return null
      }

      const hookCount = await ctx.db
        .select({ count: count() })
        .from(hooks)
        .where(eq(hooks.sessionId, input.id))
        .get()

      return {
        ...session,
        hookCount: hookCount?.count ?? 0,
      }
    }),

  // Start new session
  start: publicProcedure
    .input(createSessionSchema)
    .mutation(async ({ ctx, input }) => {
      const [session] = await ctx.db
        .insert(sessions)
        .values({
          projectId: input.projectId,
          agentId: input.agentId,
          status: 'running',
        })
        .returning()

      return session
    }),

  // Stop session
  stop: publicProcedure
    .input(sessionIdSchema)
    .mutation(async ({ ctx, input }) => {
      const [session] = await ctx.db
        .update(sessions)
        .set({
          status: 'stopped',
          stoppedAt: sql`(strftime('%s', 'now'))`,
        })
        .where(eq(sessions.id, input.id))
        .returning()

      return session
    }),

  // Delete session
  delete: publicProcedure
    .input(sessionIdSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(sessions).where(eq(sessions.id, input.id))
      return { success: true }
    }),
})
