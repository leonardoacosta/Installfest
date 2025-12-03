/**
 * Sessions Router
 *
 * Handles Claude agent development sessions.
 */

import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '../trpc'

export const sessionsRouter = createTRPCRouter({
  // List all sessions
  list: publicProcedure
    .input(
      z
        .object({
          projectId: z.number().optional(),
          limit: z.number().min(1).max(100).default(50),
        })
        .optional()
    )
    .query(({ ctx, input }) => {
      const { projectId, limit = 50 } = input || {}

      if (projectId) {
        return ctx.db
          .prepare(
            `SELECT s.*, p.name as project_name
             FROM sessions s
             LEFT JOIN projects p ON s.project_id = p.id
             WHERE s.project_id = ?
             ORDER BY s.started_at DESC
             LIMIT ?`
          )
          .all(projectId, limit)
      }

      return ctx.db
        .prepare(
          `SELECT s.*, p.name as project_name
           FROM sessions s
           LEFT JOIN projects p ON s.project_id = p.id
           ORDER BY s.started_at DESC
           LIMIT ?`
        )
        .all(limit)
    }),

  // Get session by ID with hook count
  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => {
      const session = ctx.db
        .prepare(
          `SELECT s.*, p.name as project_name
           FROM sessions s
           LEFT JOIN projects p ON s.project_id = p.id
           WHERE s.id = ?`
        )
        .get(input.id)

      if (!session) {
        return null
      }

      const hookCount = ctx.db
        .prepare('SELECT COUNT(*) as count FROM hooks WHERE session_id = ?')
        .get(input.id) as { count: number }

      return {
        ...session,
        hook_count: hookCount.count,
      }
    }),

  // Start new session
  start: publicProcedure
    .input(
      z.object({
        projectId: z.number(),
        agentId: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const result = ctx.db
        .prepare(
          'INSERT INTO sessions (project_id, agent_id, status) VALUES (?, ?, ?)'
        )
        .run(input.projectId, input.agentId || null, 'running')

      return {
        id: result.lastInsertRowid,
        project_id: input.projectId,
        agent_id: input.agentId,
        status: 'running',
      }
    }),

  // Stop session
  stop: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => {
      ctx.db
        .prepare(
          'UPDATE sessions SET status = ?, ended_at = CURRENT_TIMESTAMP WHERE id = ?'
        )
        .run('stopped', input.id)

      return { success: true }
    }),

  // Delete session
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => {
      ctx.db.prepare('DELETE FROM sessions WHERE id = ?').run(input.id)
      return { success: true }
    }),
})
