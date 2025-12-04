/**
 * Config Router
 *
 * Handles threshold configuration for failure notifications.
 */

import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const configRouter = createTRPCRouter({
  // Get current threshold configuration
  getThresholds: publicProcedure.query(({ ctx }) => {
    // Get the most recent config (should only be one row)
    const config = ctx.db
      .prepare('SELECT * FROM threshold_config ORDER BY id DESC LIMIT 1')
      .get();

    if (!config) {
      // Return default config if none exists
      return {
        id: 0,
        enabled: true,
        minFailedTests: 1,
        failureRate: 0,
        includeFlaky: false,
        onlyNewFailures: true,
        criticalTestPatterns: null,
        excludeTestPatterns: null,
        rateLimitPerWorkflow: 1,
        globalRateLimit: 5,
        createdAt: null,
        updatedAt: null,
      };
    }

    return config;
  }),

  // Update threshold configuration
  updateThresholds: publicProcedure
    .input(
      z.object({
        enabled: z.boolean().optional(),
        minFailedTests: z.number().min(0).optional(),
        failureRate: z.number().min(0).max(100).optional(),
        includeFlaky: z.boolean().optional(),
        onlyNewFailures: z.boolean().optional(),
        criticalTestPatterns: z.array(z.string()).optional(),
        excludeTestPatterns: z.array(z.string()).optional(),
        rateLimitPerWorkflow: z.number().min(0).optional(),
        globalRateLimit: z.number().min(0).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      // Check if config exists
      const existing = ctx.db
        .prepare('SELECT id FROM threshold_config ORDER BY id DESC LIMIT 1')
        .get();

      const criticalPatternsJson = input.criticalTestPatterns
        ? JSON.stringify(input.criticalTestPatterns)
        : undefined;
      const excludePatternsJson = input.excludeTestPatterns
        ? JSON.stringify(input.excludeTestPatterns)
        : undefined;

      if (existing) {
        // Update existing config
        const setClauses: string[] = ['updated_at = ?'];
        const params: any[] = [Math.floor(Date.now() / 1000)];

        if (input.enabled !== undefined) {
          setClauses.push('enabled = ?');
          params.push(input.enabled ? 1 : 0);
        }

        if (input.minFailedTests !== undefined) {
          setClauses.push('min_failed_tests = ?');
          params.push(input.minFailedTests);
        }

        if (input.failureRate !== undefined) {
          setClauses.push('failure_rate = ?');
          params.push(input.failureRate);
        }

        if (input.includeFlaky !== undefined) {
          setClauses.push('include_flaky = ?');
          params.push(input.includeFlaky ? 1 : 0);
        }

        if (input.onlyNewFailures !== undefined) {
          setClauses.push('only_new_failures = ?');
          params.push(input.onlyNewFailures ? 1 : 0);
        }

        if (criticalPatternsJson !== undefined) {
          setClauses.push('critical_test_patterns = ?');
          params.push(criticalPatternsJson);
        }

        if (excludePatternsJson !== undefined) {
          setClauses.push('exclude_test_patterns = ?');
          params.push(excludePatternsJson);
        }

        if (input.rateLimitPerWorkflow !== undefined) {
          setClauses.push('rate_limit_per_workflow = ?');
          params.push(input.rateLimitPerWorkflow);
        }

        if (input.globalRateLimit !== undefined) {
          setClauses.push('global_rate_limit = ?');
          params.push(input.globalRateLimit);
        }

        params.push((existing as any).id);

        const query = `UPDATE threshold_config SET ${setClauses.join(', ')} WHERE id = ?`;
        ctx.db.prepare(query).run(...params);

        return { success: true, id: (existing as any).id };
      } else {
        // Insert new config
        const result = ctx.db
          .prepare(
            `INSERT INTO threshold_config
             (enabled, min_failed_tests, failure_rate, include_flaky, only_new_failures,
              critical_test_patterns, exclude_test_patterns, rate_limit_per_workflow, global_rate_limit)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             RETURNING id`
          )
          .get(
            input.enabled ? 1 : 0,
            input.minFailedTests ?? 1,
            input.failureRate ?? 0,
            input.includeFlaky ? 1 : 0,
            input.onlyNewFailures !== false ? 1 : 0,
            criticalPatternsJson ?? null,
            excludePatternsJson ?? null,
            input.rateLimitPerWorkflow ?? 1,
            input.globalRateLimit ?? 5
          );

        return result;
      }
    }),

  // Validate regex pattern
  validatePattern: publicProcedure
    .input(z.object({ pattern: z.string() }))
    .query(({ input }) => {
      try {
        new RegExp(input.pattern);
        return { valid: true, error: null };
      } catch (error) {
        return {
          valid: false,
          error: error instanceof Error ? error.message : 'Invalid regex pattern',
        };
      }
    }),

  // Test pattern matching against a test name
  testPattern: publicProcedure
    .input(
      z.object({
        pattern: z.string(),
        testName: z.string(),
      })
    )
    .query(({ input }) => {
      try {
        const regex = new RegExp(input.pattern);
        const matches = regex.test(input.testName);
        return { matches, error: null };
      } catch (error) {
        return {
          matches: false,
          error: error instanceof Error ? error.message : 'Invalid regex pattern',
        };
      }
    }),
});
