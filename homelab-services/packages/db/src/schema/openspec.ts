import { sqliteTable, integer, text, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { projects } from './projects';

export const openspecSpecs = sqliteTable('openspec_specs', {
  id: text('id').primaryKey(), // Change ID from filesystem (e.g., "1-add-openspec-sync")
  projectId: integer('project_id').references(() => projects.id).notNull(),
  title: text('title').notNull(),
  status: text('status', {
    enum: ['proposing', 'approved', 'assigned', 'in_progress', 'review', 'applied', 'archived']
  }).default('proposing').notNull(),
  statusChangedAt: integer('status_changed_at', { mode: 'timestamp' }),
  statusChangedBy: text('status_changed_by'), // 'user:123', 'session:456', 'system'
  proposalContent: text('proposal_content'), // Full proposal.md markdown
  tasksContent: text('tasks_content'), // Full tasks.md markdown
  designContent: text('design_content'), // Full design.md markdown (nullable)
  lastSyncedAt: integer('last_synced_at', { mode: 'timestamp' }),
  filesystemModifiedAt: integer('filesystem_modified_at', { mode: 'timestamp' }),
  dbModifiedAt: integer('db_modified_at', { mode: 'timestamp' }),
  syncError: text('sync_error'), // Last sync error message if any
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
}, (table) => ({
  projectIdIdx: index('openspec_specs_project_id_idx').on(table.projectId),
  statusIdx: index('openspec_specs_status_idx').on(table.status),
  lastSyncedAtIdx: index('openspec_specs_last_synced_at_idx').on(table.lastSyncedAt),
}));

export type OpenspecSpec = typeof openspecSpecs.$inferSelect;
export type NewOpenspecSpec = typeof openspecSpecs.$inferInsert;
