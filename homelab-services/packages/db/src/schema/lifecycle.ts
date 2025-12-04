import { sqliteTable, integer, text, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { openspecSpecs } from './openspec';
import { projects } from './projects';
import { sessions } from './sessions';

export const specLifecycle = sqliteTable('spec_lifecycle', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  specId: text('spec_id').notNull().references(() => openspecSpecs.id),
  fromState: text('from_state', {
    enum: ['proposing', 'approved', 'assigned', 'in_progress', 'review', 'applied', 'archived']
  }), // nullable for initial state
  toState: text('to_state', {
    enum: ['proposing', 'approved', 'assigned', 'in_progress', 'review', 'applied', 'archived']
  }).notNull(),
  triggeredBy: text('triggered_by', {
    enum: ['user', 'system', 'worker']
  }).notNull(),
  triggerUserId: integer('trigger_user_id'), // nullable, only if user action
  triggerSessionId: integer('trigger_session_id').references(() => sessions.id), // nullable, only if worker action
  transitionedAt: integer('transitioned_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  notes: text('notes'), // Optional context about transition
}, (table) => ({
  specIdIdx: index('spec_lifecycle_spec_id_idx').on(table.specId),
  transitionedAtIdx: index('spec_lifecycle_transitioned_at_idx').on(table.transitionedAt),
  specIdTransitionedAtIdx: index('spec_lifecycle_spec_id_transitioned_at_idx').on(table.specId, table.transitionedAt),
}));

export const appliedSpecs = sqliteTable('applied_specs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  specId: text('spec_id').notNull().references(() => openspecSpecs.id),
  projectId: integer('project_id').notNull().references(() => projects.id),
  appliedAt: integer('applied_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  appliedBy: integer('applied_by').references(() => sessions.id), // Session that applied the spec
  verificationStatus: text('verification_status', {
    enum: ['pending', 'tests_passed', 'tests_failed']
  }).default('pending').notNull(),
  verificationNotes: text('verification_notes'),
}, (table) => ({
  projectIdIdx: index('applied_specs_project_id_idx').on(table.projectId),
  specIdIdx: index('applied_specs_spec_id_idx').on(table.specId),
  uniqueProjectSpec: uniqueIndex('unique_project_spec').on(table.projectId, table.specId),
}));

export type SpecLifecycle = typeof specLifecycle.$inferSelect;
export type NewSpecLifecycle = typeof specLifecycle.$inferInsert;
export type AppliedSpec = typeof appliedSpecs.$inferSelect;
export type NewAppliedSpec = typeof appliedSpecs.$inferInsert;
