/**
 * Reports Router
 *
 * Handles Playwright test report management.
 */

import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '../trpc'

export const reportsRouter = createTRPCRouter({
  // List all reports with filtering
  list: publicProcedure
    .input(
      z
        .object({
          workflow: z.string().optional(),
          status: z.enum(['passed', 'failed', 'skipped']).optional(),
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(({ ctx, input }) => {
      const { workflow, status, limit = 50, offset = 0 } = input || {}

      let query = 'SELECT * FROM reports WHERE 1=1'
      const params: any[] = []

      if (workflow) {
        query += ' AND workflow_name = ?'
        params.push(workflow)
      }

      if (status) {
        query += ' AND status = ?'
        params.push(status)
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
      params.push(limit, offset)

      return ctx.db.prepare(query).all(...params)
    }),

  // Get unique workflow names
  workflows: publicProcedure.query(({ ctx }) => {
    return ctx.db
      .prepare('SELECT DISTINCT workflow_name FROM reports ORDER BY workflow_name')
      .all()
  }),

  // Get report by ID
  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => {
      return ctx.db
        .prepare('SELECT * FROM reports WHERE id = ?')
        .get(input.id)
    }),

  // Get report statistics
  stats: publicProcedure
    .input(
      z
        .object({
          workflow: z.string().optional(),
        })
        .optional()
    )
    .query(({ ctx, input }) => {
      const { workflow } = input || {}

      if (workflow) {
        return ctx.db
          .prepare(
            `SELECT
               COUNT(*) as total_reports,
               SUM(total_tests) as total_tests,
               SUM(passed) as total_passed,
               SUM(failed) as total_failed,
               SUM(skipped) as total_skipped,
               AVG(CAST(passed AS REAL) / NULLIF(total_tests, 0)) as success_rate
             FROM reports
             WHERE workflow_name = ?`
          )
          .get(workflow)
      }

      return ctx.db
        .prepare(
          `SELECT
             COUNT(*) as total_reports,
             SUM(total_tests) as total_tests,
             SUM(passed) as total_passed,
             SUM(failed) as total_failed,
             SUM(skipped) as total_skipped,
             AVG(CAST(passed AS REAL) / NULLIF(total_tests, 0)) as success_rate
           FROM reports`
        )
        .get()
    }),

  // Delete report
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => {
      ctx.db.prepare('DELETE FROM reports WHERE id = ?').run(input.id)
      return { success: true }
    }),
})
