import { sqliteTable, integer, text, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { reports } from './reports';

export const failureHistory = sqliteTable(
  'failure_history',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    testName: text('test_name').notNull().unique(),
    testFile: text('test_file'),
    lineNumber: integer('line_number'),
    firstSeen: integer('first_seen', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
    lastSeen: integer('last_seen', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
    occurrences: integer('occurrences').notNull().default(1),
    consecutiveFailures: integer('consecutive_failures').notNull().default(1),
    totalRuns: integer('total_runs').notNull().default(1),
    classificationType: text('classification_type', {
      enum: ['NEW', 'FLAKY', 'RECURRING', 'PERSISTENT']
    }),
  },
  (table) => ({
    testNameIdx: index('idx_failure_test_name').on(table.testName),
    classificationIdx: index('idx_failure_classification').on(table.classificationType),
    lastSeenIdx: index('idx_failure_last_seen').on(table.lastSeen),
  })
);

export const testFailures = sqliteTable(
  'test_failures',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    reportId: integer('report_id')
      .notNull()
      .references(() => reports.id, { onDelete: 'cascade' }),
    testName: text('test_name').notNull(),
    testFile: text('test_file'),
    lineNumber: integer('line_number'),
    error: text('error'),
    stackTrace: text('stack_trace'),
    duration: integer('duration'), // in milliseconds
    retries: integer('retries').default(0),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  },
  (table) => ({
    reportIdx: index('idx_test_failures_report').on(table.reportId),
    testNameIdx: index('idx_test_failures_test_name').on(table.testName),
  })
);

export type FailureHistory = typeof failureHistory.$inferSelect;
export type NewFailureHistory = typeof failureHistory.$inferInsert;
export type TestFailure = typeof testFailures.$inferSelect;
export type NewTestFailure = typeof testFailures.$inferInsert;
