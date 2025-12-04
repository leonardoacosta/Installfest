import { sqliteTable, integer, text, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { reports } from './reports';

export const remediationAttempts = sqliteTable(
  'remediation_attempts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    reportId: integer('report_id')
      .notNull()
      .references(() => reports.id, { onDelete: 'cascade' }),
    testName: text('test_name').notNull(),
    claudeSessionId: text('claude_session_id'),
    triggeredAt: integer('triggered_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
    completedAt: integer('completed_at', { mode: 'timestamp' }),
    status: text('status', {
      enum: ['pending', 'in_progress', 'fixed', 'failed', 'skipped']
    }).notNull().default('pending'),
    fixDescription: text('fix_description'),
    prUrl: text('pr_url'),
    rerunReportId: integer('rerun_report_id').references(() => reports.id, { onDelete: 'set null' }),
    rerunPassed: integer('rerun_passed', { mode: 'boolean' }),
    errorMessage: text('error_message'),
    classificationType: text('classification_type', {
      enum: ['NEW', 'FLAKY', 'RECURRING', 'PERSISTENT']
    }),
  },
  (table) => ({
    reportIdx: index('idx_remediation_report').on(table.reportId, table.triggeredAt),
    testNameIdx: index('idx_remediation_test_name').on(table.testName),
    statusIdx: index('idx_remediation_status').on(table.status, table.triggeredAt),
    sessionIdx: index('idx_remediation_session').on(table.claudeSessionId),
  })
);

export type RemediationAttempt = typeof remediationAttempts.$inferSelect;
export type NewRemediationAttempt = typeof remediationAttempts.$inferInsert;
