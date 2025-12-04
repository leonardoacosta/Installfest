#!/usr/bin/env bun
import { getDb } from './packages/db/src/client';
import { projects, sessions } from './packages/db/src/schema';

const db = getDb();

// Create test project
const [project] = await db.insert(projects).values({
  name: 'Hook Test Project',
  path: '/tmp/hook-test',
  description: 'Test project for hook validation'
}).returning();

console.log('Created project:', project);

// Create test session
const [session] = await db.insert(sessions).values({
  projectId: project.id,
  agentId: `test-agent-${Date.now()}`,
  status: 'running'
}).returning();

console.log('Created session:', session);
console.log('\nExport these for hook testing:');
console.log(`export CLAUDE_SESSION_ID=${session.id}`);
console.log(`export CLAUDE_AGENT_ID=${session.agentId}`);
