import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { projects } from './projects';

export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  agentId: text('agent_id').notNull().unique(),
  status: text('status', { enum: ['running', 'stopped', 'error'] })
    .notNull()
    .default('stopped'),
  startedAt: integer('started_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  stoppedAt: integer('stopped_at', { mode: 'timestamp' }),
  errorMessage: text('error_message'),
});

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
