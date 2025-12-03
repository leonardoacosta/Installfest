import { sqliteTable, integer, text, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { sessions } from './sessions';

export const hooks = sqliteTable('hooks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: integer('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),
  hookType: text('hook_type').notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  toolName: text('tool_name'),
  toolInput: text('tool_input'),
  toolOutput: text('tool_output'),
  durationMs: integer('duration_ms'),
  success: integer('success', { mode: 'boolean' }),
  errorMessage: text('error_message'),
  metadata: text('metadata'), // JSON string
}, (table) => ({
  sessionIdx: index('idx_hooks_session').on(table.sessionId, table.timestamp),
  typeIdx: index('idx_hooks_type').on(table.hookType, table.timestamp),
  toolIdx: index('idx_hooks_tool').on(table.toolName, table.timestamp),
}));

export type Hook = typeof hooks.$inferSelect;
export type NewHook = typeof hooks.$inferInsert;
