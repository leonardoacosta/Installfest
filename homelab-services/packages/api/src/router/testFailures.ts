/**
 * Test Failures Router
 *
 * Handles incoming test failure notifications from playwright-server
 * and creates Claude Code sessions for automated remediation.
 */

import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const testFailuresRouter = createTRPCRouter({
  /**
   * Receive test failure notification and create Claude session
   */
  notify: publicProcedure
    .input(
      z.object({
        workflow: z.string(),
        runNumber: z.number().optional(),
        reportId: z.number(),
        failures: z.array(
          z.object({
            testName: z.string(),
            testFile: z.string().optional(),
            lineNumber: z.number().optional(),
            errorMessage: z.string(),
            stackTrace: z.string().optional(),
            classificationType: z.enum(['NEW', 'FLAKY', 'RECURRING', 'PERSISTENT']),
          })
        ),
        totalTests: z.number(),
        failedTests: z.number(),
        passedTests: z.number(),
        timestamp: z.string().datetime(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Find or create project for this workflow
      let project = ctx.db
        .prepare('SELECT * FROM projects WHERE name = ?')
        .get(input.workflow) as any;

      if (!project) {
        // Create project for this workflow
        const projectResult = ctx.db
          .prepare(
            `INSERT INTO projects (name, path, description)
             VALUES (?, ?, ?)
             RETURNING *`
          )
          .get(
            input.workflow,
            `/projects/${input.workflow}`, // Default path
            `Automated project for workflow: ${input.workflow}`
          );

        project = projectResult;
      }

      // Generate agent ID for this session
      const agentId = `test-fix-${input.workflow}-${input.reportId}-${Date.now()}`;

      // Create session
      const sessionResult = ctx.db
        .prepare(
          `INSERT INTO sessions (project_id, agent_id, status)
           VALUES (?, ?, 'running')
           RETURNING *`
        )
        .get(project.id, agentId) as { id: number };

      // Generate initial prompt with failure context
      const prompt = generateFailurePrompt(input);

      // Log the notification as a hook event
      ctx.db
        .prepare(
          `INSERT INTO hooks
           (session_id, hook_type, tool_name, tool_input, metadata)
           VALUES (?, 'session_start', 'testFailureNotification', ?, ?)`
        )
        .run(
          sessionResult.id,
          JSON.stringify(input),
          JSON.stringify({
            workflow: input.workflow,
            reportId: input.reportId,
            failureCount: input.failures.length,
          })
        );

      return {
        sessionId: agentId,
        projectId: project.id,
        databaseSessionId: sessionResult.id,
        prompt,
        message: `Created session for ${input.failures.length} test failures in ${input.workflow}`,
      };
    }),

  /**
   * Update remediation status (called by Claude agent when work completes)
   */
  updateStatus: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
        status: z.enum(['fixed', 'failed', 'skipped']),
        fixDescription: z.string().optional(),
        prUrl: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      // Find session
      const session = ctx.db
        .prepare('SELECT * FROM sessions WHERE agent_id = ?')
        .get(input.sessionId) as any;

      if (!session) {
        throw new Error('Session not found');
      }

      // Update session status
      ctx.db
        .prepare(
          `UPDATE sessions
           SET status = 'stopped', stopped_at = ?
           WHERE id = ?`
        )
        .run(Math.floor(Date.now() / 1000), session.id);

      // TODO: Update remediation_attempts in playwright-server database
      // This would require cross-database access or API call back to playwright-server

      return { success: true };
    }),
});

/**
 * Generate initial prompt for Claude with failure context
 */
function generateFailurePrompt(input: {
  workflow: string;
  runNumber?: number;
  failures: Array<{
    testName: string;
    testFile?: string;
    lineNumber?: number;
    errorMessage: string;
    stackTrace?: string;
    classificationType: string;
  }>;
  totalTests: number;
  failedTests: number;
  passedTests: number;
}): string {
  const lines: string[] = [];

  lines.push('# Test Failure Remediation Request');
  lines.push('');
  lines.push(`**Workflow:** ${input.workflow}`);
  if (input.runNumber) {
    lines.push(`**Run:** #${input.runNumber}`);
  }
  lines.push(
    `**Summary:** ${input.failedTests} of ${input.totalTests} tests failed (${((input.failedTests / input.totalTests) * 100).toFixed(1)}% failure rate)`
  );
  lines.push('');

  lines.push('## Failed Tests');
  lines.push('');

  for (const failure of input.failures) {
    lines.push(`### ${failure.testName}`);
    lines.push('');

    if (failure.testFile) {
      lines.push(`**File:** \`${failure.testFile}\``);
      if (failure.lineNumber) {
        lines.push(`**Line:** ${failure.lineNumber}`);
      }
    }

    lines.push(`**Classification:** ${failure.classificationType}`);
    lines.push('');

    lines.push('**Error:**');
    lines.push('```');
    lines.push(failure.errorMessage);
    lines.push('```');
    lines.push('');

    if (failure.stackTrace) {
      lines.push('<details>');
      lines.push('<summary>Stack Trace</summary>');
      lines.push('');
      lines.push('```');
      lines.push(failure.stackTrace);
      lines.push('```');
      lines.push('</details>');
      lines.push('');
    }
  }

  lines.push('## Task');
  lines.push('');
  lines.push(
    'Please investigate these test failures and propose fixes. For each failure:'
  );
  lines.push('1. Analyze the error message and stack trace');
  lines.push('2. Examine the test file and identify the root cause');
  lines.push('3. Propose a fix or recommend further investigation');
  lines.push('4. If possible, implement the fix and verify tests pass');
  lines.push('');
  lines.push(
    '_This is an automated remediation request from the Playwright Report Server._'
  );

  return lines.join('\n');
}
