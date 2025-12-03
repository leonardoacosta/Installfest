/**
 * Hooks Router
 *
 * Handles Claude agent hook execution tracking and statistics.
 */

import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '../trpc'

export const hooksRouter = createTRPCRouter({
  // List hooks with filtering
  list: publicProcedure
    .input(
      z
        .object({
          sessionId: z.number().optional(),
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(({ ctx, input }) => {
      const { sessionId, limit = 50, offset = 0 } = input || {}

      if (sessionId) {
        return ctx.db
          .prepare(
            `SELECT * FROM hooks
             WHERE session_id = ?
             ORDER BY timestamp DESC
             LIMIT ? OFFSET ?`
          )
          .all(sessionId, limit, offset)
      }

      return ctx.db
        .prepare(
          `SELECT h.*, s.agent_id, p.name as project_name
           FROM hooks h
           LEFT JOIN sessions s ON h.session_id = s.id
           LEFT JOIN projects p ON s.project_id = p.id
           ORDER BY h.timestamp DESC
           LIMIT ? OFFSET ?`
        )
        .all(limit, offset)
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
    .query(({ ctx, input }) => {
      const { sessionId } = input || {}

      if (sessionId) {
        return ctx.db
          .prepare(
            `SELECT
               COUNT(*) as total,
               SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
               SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed,
               AVG(duration_ms) as avg_duration,
               hook_type,
               tool_name
             FROM hooks
             WHERE session_id = ?
             GROUP BY hook_type, tool_name`
          )
          .all(sessionId)
      }

      return ctx.db
        .prepare(
          `SELECT
             COUNT(*) as total,
             SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
             SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed,
             AVG(duration_ms) as avg_duration,
             hook_type,
             tool_name
           FROM hooks
           GROUP BY hook_type, tool_name`
        )
        .all()
    }),

  // Create hook record
  create: publicProcedure
    .input(
      z.object({
        sessionId: z.number(),
        hookType: z.string(),
        toolName: z.string().optional(),
        durationMs: z.number().optional(),
        success: z.boolean().default(true),
      })
    )
    .mutation(({ ctx, input }) => {
      const result = ctx.db
        .prepare(
          `INSERT INTO hooks (session_id, hook_type, tool_name, duration_ms, success)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run(
          input.sessionId,
          input.hookType,
          input.toolName || null,
          input.durationMs || null,
          input.success ? 1 : 0
        )

      return {
        id: result.lastInsertRowid,
      }
    }),
})
