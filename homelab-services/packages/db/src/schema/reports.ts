import { sqliteTable, integer, text, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const reports = sqliteTable(
  'reports',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    workflowName: text('workflow_name').notNull(),
    runNumber: integer('run_number'),
    hash: text('hash').notNull().unique(),
    filePath: text('file_path').notNull(),
    totalTests: integer('total_tests').notNull().default(0),
    passed: integer('passed').notNull().default(0),
    failed: integer('failed').notNull().default(0),
    skipped: integer('skipped').notNull().default(0),
    status: text('status', { enum: ['passed', 'failed', 'mixed'] }).notNull().default('passed'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  },
  (table) => ({
    workflowIdx: index('idx_reports_workflow').on(table.workflowName, table.createdAt),
    statusIdx: index('idx_reports_status').on(table.status, table.createdAt),
    hashIdx: index('idx_reports_hash').on(table.hash),
  })
);

export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
