import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { projects } from './projects';
import { openspecSpecs } from './openspec';

export const workQueue = sqliteTable('work_queue', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  specId: text('spec_id')
    .notNull()
    .references(() => openspecSpecs.id, { onDelete: 'cascade' }),
  priority: integer('priority').notNull().default(3), // 1-5 scale
  position: integer('position').notNull(), // Ordering within queue
  status: text('status', {
    enum: ['queued', 'assigned', 'blocked', 'completed']
  })
    .notNull()
    .default('queued'),
  blockedBy: text('blocked_by')
    .references(() => openspecSpecs.id, { onDelete: 'set null' }),
  addedAt: integer('added_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
  assignedAt: integer('assigned_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
});

export type WorkQueueItem = typeof workQueue.$inferSelect;
export type NewWorkQueueItem = typeof workQueue.$inferInsert;
