import { sqliteTable, integer, text, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { openspecSpecs } from './openspec';

export const syncHistory = sqliteTable('sync_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  specId: text('spec_id').references(() => openspecSpecs.id).notNull(),
  syncDirection: text('sync_direction', { enum: ['fs_to_db', 'db_to_fs'] }).notNull(),
  triggeredBy: text('triggered_by', { enum: ['file_watcher', 'periodic', 'user_edit', 'manual'] }).notNull(),
  success: integer('success', { mode: 'boolean' }).notNull(),
  errorMessage: text('error_message'),
  filesChanged: text('files_changed'), // JSON array of changed files
  syncedAt: integer('synced_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
}, (table) => ({
  specIdIdx: index('sync_history_spec_id_idx').on(table.specId),
  syncedAtIdx: index('sync_history_synced_at_idx').on(table.syncedAt),
}));

export type SyncHistory = typeof syncHistory.$inferSelect;
export type NewSyncHistory = typeof syncHistory.$inferInsert;
