/**
 * Failures Router
 *
 * Handles test failure history and classification.
 */

import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const failuresRouter = createTRPCRouter({
  // List active failures (tests that failed in most recent report)
  listActive: publicProcedure
    .input(
      z
        .object({
          workflow: z.string().optional(),
          classification: z.enum(['NEW', 'FLAKY', 'RECURRING', 'PERSISTENT']).optional(),
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(({ ctx, input }) => {
      const { workflow, classification, limit = 50, offset = 0 } = input || {};

      let query = `
        SELECT
          fh.*,
          tf.test_file,
          tf.line_number,
          tf.error,
          r.workflow_name,
          r.run_number,
          r.created_at as report_created_at
        FROM failure_history fh
        LEFT JOIN test_failures tf ON fh.test_name = tf.test_name
        LEFT JOIN reports r ON tf.report_id = r.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (workflow) {
        query += ' AND r.workflow_name = ?';
        params.push(workflow);
      }

      if (classification) {
        query += ' AND fh.classification_type = ?';
        params.push(classification);
      }

      query += ' GROUP BY fh.id ORDER BY fh.last_seen DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      return ctx.db.prepare(query).all(...params);
    }),

  // Get failure history for a specific test
  getHistory: publicProcedure
    .input(z.object({ testName: z.string() }))
    .query(({ ctx, input }) => {
      // Get failure history
      const history = ctx.db
        .prepare('SELECT * FROM failure_history WHERE test_name = ?')
        .get(input.testName);

      // Get all failure occurrences
      const failures = ctx.db
        .prepare(
          `SELECT
            tf.*,
            r.workflow_name,
            r.run_number,
            r.created_at as report_created_at
           FROM test_failures tf
           JOIN reports r ON tf.report_id = r.id
           WHERE tf.test_name = ?
           ORDER BY tf.created_at DESC`
        )
        .all(input.testName);

      return {
        history,
        failures,
      };
    }),

  // Get aggregated failure statistics
  getStats: publicProcedure
    .input(
      z
        .object({
          workflow: z.string().optional(),
        })
        .optional()
    )
    .query(({ ctx, input }) => {
      const { workflow } = input || {};

      let query = `
        SELECT
          COUNT(DISTINCT fh.test_name) as total_failures,
          SUM(CASE WHEN fh.classification_type = 'NEW' THEN 1 ELSE 0 END) as new_failures,
          SUM(CASE WHEN fh.classification_type = 'FLAKY' THEN 1 ELSE 0 END) as flaky_failures,
          SUM(CASE WHEN fh.classification_type = 'RECURRING' THEN 1 ELSE 0 END) as recurring_failures,
          SUM(CASE WHEN fh.classification_type = 'PERSISTENT' THEN 1 ELSE 0 END) as persistent_failures,
          AVG(fh.occurrences * 1.0 / fh.total_runs) as avg_failure_rate
        FROM failure_history fh
      `;

      if (workflow) {
        query += `
          JOIN test_failures tf ON fh.test_name = tf.test_name
          JOIN reports r ON tf.report_id = r.id
          WHERE r.workflow_name = ?
        `;
        return ctx.db.prepare(query).get(workflow);
      }

      return ctx.db.prepare(query).get();
    }),

  // Classify a specific failure
  classify: publicProcedure
    .input(
      z.object({
        testName: z.string(),
      })
    )
    .query(({ ctx, input }) => {
      const history = ctx.db
        .prepare('SELECT * FROM failure_history WHERE test_name = ?')
        .get(input.testName);

      if (!history) {
        return { type: 'NEW', reason: 'First occurrence' };
      }

      const failureRate = (history as any).occurrences / (history as any).total_runs;
      const consecutiveFailures = (history as any).consecutive_failures;

      let type: 'NEW' | 'FLAKY' | 'RECURRING' | 'PERSISTENT';
      let reason: string;

      if ((history as any).occurrences === 1) {
        type = 'NEW';
        reason = 'First occurrence';
      } else if (failureRate > 0.8 || consecutiveFailures >= 5) {
        type = 'PERSISTENT';
        reason = `High failure rate (${(failureRate * 100).toFixed(1)}%) or consecutive failures (${consecutiveFailures})`;
      } else if (failureRate < 0.3) {
        type = 'FLAKY';
        reason = `Low failure rate (${(failureRate * 100).toFixed(1)}%)`;
      } else {
        type = 'RECURRING';
        reason = `Moderate failure rate (${(failureRate * 100).toFixed(1)}%)`;
      }

      return { type, reason, history };
    }),
});
