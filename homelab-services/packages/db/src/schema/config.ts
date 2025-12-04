import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const thresholdConfig = sqliteTable('threshold_config', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  minFailedTests: integer('min_failed_tests').notNull().default(1),
  failureRate: integer('failure_rate').notNull().default(0), // Percentage (0-100)
  includeFlaky: integer('include_flaky', { mode: 'boolean' }).notNull().default(false),
  onlyNewFailures: integer('only_new_failures', { mode: 'boolean' }).notNull().default(true),
  criticalTestPatterns: text('critical_test_patterns'), // JSON array of regex patterns
  excludeTestPatterns: text('exclude_test_patterns'), // JSON array of regex patterns
  rateLimitPerWorkflow: integer('rate_limit_per_workflow').default(1), // Max sessions per workflow per hour
  globalRateLimit: integer('global_rate_limit').default(5), // Max total sessions per hour
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export type ThresholdConfig = typeof thresholdConfig.$inferSelect;
export type NewThresholdConfig = typeof thresholdConfig.$inferInsert;
