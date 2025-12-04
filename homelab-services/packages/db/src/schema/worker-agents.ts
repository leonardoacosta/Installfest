import { sqliteTable, integer, text, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { sessions } from './sessions';
import { openspecSpecs } from './openspec';

export const workerAgents = sqliteTable('worker_agents', {
  id: text('id').primaryKey(), // Task tool agent ID
  sessionId: integer('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),
  specId: text('spec_id')
    .notNull()
    .references(() => openspecSpecs.id, { onDelete: 'cascade' }),
  agentType: text('agent_type').notNull(), // subagent_type: t3-stack-developer, e2e-test-engineer, etc.
  status: text('status', {
    enum: ['spawned', 'active', 'completed', 'failed', 'cancelled']
  })
    .notNull()
    .default('spawned'),
  spawnedAt: integer('spawned_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
  startedAt: integer('started_at', { mode: 'timestamp' }), // When first hook received
  completedAt: integer('completed_at', { mode: 'timestamp' }), // When work finished
  result: text('result', { mode: 'json' }).$type<{
    filesChanged?: string[];
    testsRun?: number;
    testsPassed?: number;
    errors?: string[];
  }>(), // Completion summary
  retryCount: integer('retry_count').notNull().default(0),
  errorMessage: text('error_message'), // If failed, why
}, (table) => ({
  sessionIdIdx: index('worker_agents_session_id_idx').on(table.sessionId),
  specIdIdx: index('worker_agents_spec_id_idx').on(table.specId),
  statusIdx: index('worker_agents_status_idx').on(table.status),
  spawnedAtIdx: index('worker_agents_spawned_at_idx').on(table.spawnedAt),
}));

export type WorkerAgent = typeof workerAgents.$inferSelect;
export type NewWorkerAgent = typeof workerAgents.$inferInsert;
