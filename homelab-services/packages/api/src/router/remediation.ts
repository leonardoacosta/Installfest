/**
 * Remediation Router
 *
 * Handles Claude-assisted test failure remediation tracking.
 */

import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const remediationRouter = createTRPCRouter({
  // List remediation attempts with filters
  list: publicProcedure
    .input(
      z
        .object({
          workflow: z.string().optional(),
          status: z.enum(['pending', 'in_progress', 'fixed', 'failed', 'skipped']).optional(),
          testName: z.string().optional(),
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(({ ctx, input }) => {
      const { workflow, status, testName, limit = 50, offset = 0 } = input || {};

      let query = `
        SELECT
          ra.*,
          r.workflow_name,
          r.run_number,
          r.created_at as report_created_at
        FROM remediation_attempts ra
        JOIN reports r ON ra.report_id = r.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (workflow) {
        query += ' AND r.workflow_name = ?';
        params.push(workflow);
      }

      if (status) {
        query += ' AND ra.status = ?';
        params.push(status);
      }

      if (testName) {
        query += ' AND ra.test_name LIKE ?';
        params.push(`%${testName}%`);
      }

      query += ' ORDER BY ra.triggered_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      return ctx.db.prepare(query).all(...params);
    }),

  // Get remediation attempt by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => {
      const attempt = ctx.db
        .prepare(
          `SELECT
            ra.*,
            r.workflow_name,
            r.run_number,
            r.hash as report_hash,
            r.file_path as report_file_path,
            r.created_at as report_created_at,
            rerun.workflow_name as rerun_workflow_name,
            rerun.run_number as rerun_run_number,
            rerun.created_at as rerun_created_at
           FROM remediation_attempts ra
           JOIN reports r ON ra.report_id = r.id
           LEFT JOIN reports rerun ON ra.rerun_report_id = rerun.id
           WHERE ra.id = ?`
        )
        .get(input.id);

      if (!attempt) {
        throw new Error('Remediation attempt not found');
      }

      return attempt;
    }),

  // Get remediation statistics
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
          COUNT(*) as total_attempts,
          SUM(CASE WHEN ra.status = 'fixed' THEN 1 ELSE 0 END) as fixed_count,
          SUM(CASE WHEN ra.status = 'failed' THEN 1 ELSE 0 END) as failed_count,
          SUM(CASE WHEN ra.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count,
          SUM(CASE WHEN ra.status = 'pending' THEN 1 ELSE 0 END) as pending_count,
          SUM(CASE WHEN ra.status = 'skipped' THEN 1 ELSE 0 END) as skipped_count,
          AVG(CASE
            WHEN ra.completed_at IS NOT NULL AND ra.triggered_at IS NOT NULL
            THEN ra.completed_at - ra.triggered_at
            ELSE NULL
          END) as avg_completion_time_seconds,
          SUM(CASE WHEN ra.rerun_passed = 1 THEN 1 ELSE 0 END) as rerun_passed_count,
          SUM(CASE WHEN ra.rerun_passed = 0 THEN 1 ELSE 0 END) as rerun_failed_count
        FROM remediation_attempts ra
      `;

      if (workflow) {
        query += `
          JOIN reports r ON ra.report_id = r.id
          WHERE r.workflow_name = ?
        `;
        return ctx.db.prepare(query).get(workflow);
      }

      return ctx.db.prepare(query).get();
    }),

  // Trigger a manual remediation attempt
  trigger: publicProcedure
    .input(
      z.object({
        reportId: z.number(),
        testName: z.string(),
        classificationType: z.enum(['NEW', 'FLAKY', 'RECURRING', 'PERSISTENT']).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const result = ctx.db
        .prepare(
          `INSERT INTO remediation_attempts
           (report_id, test_name, classification_type, status)
           VALUES (?, ?, ?, 'pending')
           RETURNING id`
        )
        .get(input.reportId, input.testName, input.classificationType);

      return result;
    }),

  // Update remediation attempt status
  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(['pending', 'in_progress', 'fixed', 'failed', 'skipped']).optional(),
        claudeSessionId: z.string().optional(),
        fixDescription: z.string().optional(),
        prUrl: z.string().optional(),
        rerunReportId: z.number().optional(),
        rerunPassed: z.boolean().optional(),
        errorMessage: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, ...updates } = input;

      const setClauses: string[] = [];
      const params: any[] = [];

      if (updates.status !== undefined) {
        setClauses.push('status = ?');
        params.push(updates.status);

        // Set completed_at when status changes to final state
        if (['fixed', 'failed', 'skipped'].includes(updates.status)) {
          setClauses.push('completed_at = ?');
          params.push(Math.floor(Date.now() / 1000));
        }
      }

      if (updates.claudeSessionId !== undefined) {
        setClauses.push('claude_session_id = ?');
        params.push(updates.claudeSessionId);
      }

      if (updates.fixDescription !== undefined) {
        setClauses.push('fix_description = ?');
        params.push(updates.fixDescription);
      }

      if (updates.prUrl !== undefined) {
        setClauses.push('pr_url = ?');
        params.push(updates.prUrl);
      }

      if (updates.rerunReportId !== undefined) {
        setClauses.push('rerun_report_id = ?');
        params.push(updates.rerunReportId);
      }

      if (updates.rerunPassed !== undefined) {
        setClauses.push('rerun_passed = ?');
        params.push(updates.rerunPassed ? 1 : 0);
      }

      if (updates.errorMessage !== undefined) {
        setClauses.push('error_message = ?');
        params.push(updates.errorMessage);
      }

      if (setClauses.length === 0) {
        throw new Error('No updates provided');
      }

      params.push(id);

      const query = `UPDATE remediation_attempts SET ${setClauses.join(', ')} WHERE id = ?`;
      ctx.db.prepare(query).run(...params);

      return { success: true };
    }),
});
