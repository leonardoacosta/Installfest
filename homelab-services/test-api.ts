#!/usr/bin/env bun
/**
 * Comprehensive API Test Suite for Claude Agent Server
 * Tests all tRPC endpoints: projects, sessions, hooks
 */

import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './packages/api/src/root';
import SuperJSON from 'superjson';

const API_URL = 'http://localhost:3002/api/trpc';

const client = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: API_URL,
      transformer: SuperJSON,
    }),
  ],
});

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, passed: true, duration: Date.now() - start });
    console.log(`✅ ${name} (${Date.now() - start}ms)`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, error: message, duration: Date.now() - start });
    console.error(`❌ ${name}: ${message} (${Date.now() - start}ms)`);
  }
}

async function runTests() {
  console.log('🧪 Starting API Tests\n');
  console.log('='.repeat(60));

  let projectId: number;
  let sessionId: number;

  // === HEALTH CHECK ===
  console.log('\n📊 Health Check');
  console.log('-'.repeat(60));

  await test('Health check endpoint', async () => {
    const response = await fetch('http://localhost:3002/api/health');
    const data = await response.json();
    if (data.status !== 'healthy') {
      throw new Error(`Health check failed: ${JSON.stringify(data)}`);
    }
  });

  // === PROJECT TESTS ===
  console.log('\n📁 Project Tests');
  console.log('-'.repeat(60));

  await test('Create project', async () => {
    const result = await client.projects.create.mutate({
      name: `Test Project ${Date.now()}`,
      path: '/tmp/test-project',
      description: 'Test project for API validation',
    });
    projectId = result.id;
    if (!projectId) throw new Error('Project ID not returned');
  });

  await test('List projects', async () => {
    const projects = await client.projects.list.query();
    if (!Array.isArray(projects)) throw new Error('Projects list not an array');
    if (projects.length === 0) throw new Error('No projects found');
  });

  await test('Get project by ID', async () => {
    const project = await client.projects.byId.query({ id: projectId });
    if (!project) throw new Error('Project not found');
    if (project.id !== projectId) throw new Error('Wrong project returned');
  });

  await test('Update project', async () => {
    const updated = await client.projects.update.mutate({
      id: projectId,
      name: 'Updated Test Project',
      description: 'Updated description',
    });
    if (updated.name !== 'Updated Test Project') throw new Error('Update failed');
  });

  // === SESSION TESTS ===
  console.log('\n🎯 Session Tests');
  console.log('-'.repeat(60));

  await test('Start session', async () => {
    const session = await client.sessions.start.mutate({
      projectId,
      agentId: `test-agent-${Date.now()}`,
    });
    sessionId = session.id;
    if (!sessionId) throw new Error('Session ID not returned');
    if (session.status !== 'running') throw new Error('Session not running');
  });

  await test('List sessions', async () => {
    const sessions = await client.sessions.list.query();
    if (!Array.isArray(sessions)) throw new Error('Sessions list not an array');
    const found = sessions.find(s => s.id === sessionId);
    if (!found) throw new Error('Created session not in list');
  });

  await test('Get session by ID', async () => {
    const session = await client.sessions.byId.query({ id: sessionId });
    if (!session) throw new Error('Session not found');
    if (session.id !== sessionId) throw new Error('Wrong session returned');
  });

  // === HOOK TESTS ===
  console.log('\n🔗 Hook Tests');
  console.log('-'.repeat(60));

  await test('Ingest hook event', async () => {
    await client.hooks.ingest.mutate({
      sessionId,
      hookType: 'pre_tool_use',
      timestamp: Date.now(),
      toolName: 'Read',
      toolInput: JSON.stringify({ file_path: '/test/file.txt' }),
      success: true,
      durationMs: 150,
      metadata: JSON.stringify({ test: true }),
    });
  });

  await test('List hooks', async () => {
    const hooks = await client.hooks.list.query({ sessionId });
    if (!Array.isArray(hooks)) throw new Error('Hooks list not an array');
    if (hooks.length === 0) throw new Error('No hooks found after ingestion');
  });

  await test('Get hook stats', async () => {
    const stats = await client.hooks.stats.query({ sessionId });
    if (!Array.isArray(stats)) throw new Error('Stats should be an array');
    if (stats.length === 0) throw new Error('Stats show zero hooks');
    const firstStat = stats[0];
    if (typeof firstStat.total !== 'number') throw new Error('Invalid stats format');
  });

  // === PAGINATION & FILTERING ===
  console.log('\n📄 Pagination & Filtering Tests');
  console.log('-'.repeat(60));

  await test('List hooks with pagination', async () => {
    const hooks = await client.hooks.list.query({
      sessionId,
      limit: 5,
      offset: 0,
    });
    if (!Array.isArray(hooks)) throw new Error('Paginated hooks not an array');
  });

  await test('Filter hooks by type', async () => {
    const hooks = await client.hooks.list.query({
      sessionId,
      hookType: 'pre_tool_use',
    });
    const wrongType = hooks.find(h => h.hookType !== 'pre_tool_use');
    if (wrongType) throw new Error('Filter by type failed');
  });

  // === CONCURRENT OPERATIONS ===
  console.log('\n🔄 Concurrent Operations Tests');
  console.log('-'.repeat(60));

  await test('Multiple concurrent hook ingestions', async () => {
    const promises = Array.from({ length: 10 }, (_, i) =>
      client.hooks.ingest.mutate({
        sessionId,
        hookType: 'post_tool_use',
        timestamp: Date.now() + i,
        toolName: `Tool${i}`,
        success: true,
        durationMs: 100 + i,
      })
    );
    await Promise.all(promises);
  });

  // === ERROR HANDLING ===
  console.log('\n⚠️  Error Handling Tests');
  console.log('-'.repeat(60));

  await test('Get non-existent project', async () => {
    const project = await client.projects.byId.query({ id: 999999 });
    if (project !== undefined) {
      throw new Error('Should return undefined for non-existent project');
    }
  });

  await test('Create project with duplicate name', async () => {
    try {
      await client.projects.create.mutate({
        name: 'Updated Test Project', // Already exists
        path: '/tmp/duplicate',
      });
      throw new Error('Should have thrown error for duplicate name');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Should have thrown')) {
        throw error;
      }
      // Expected error
    }
  });

  await test('Start session with non-existent project', async () => {
    try {
      await client.sessions.start.mutate({
        projectId: 999999,
        agentId: 'invalid-project-agent',
      });
      throw new Error('Should have thrown error for non-existent project');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Should have thrown')) {
        throw error;
      }
      // Expected error
    }
  });

  // === CLEANUP ===
  console.log('\n🧹 Cleanup Tests');
  console.log('-'.repeat(60));

  await test('Stop session', async () => {
    await client.sessions.stop.mutate({ id: sessionId });
    const session = await client.sessions.byId.query({ id: sessionId });
    if (session.status !== 'stopped') throw new Error('Session not stopped');
  });

  await test('Delete project (cascades sessions and hooks)', async () => {
    await client.projects.delete.mutate({ id: projectId });
    try {
      await client.projects.byId.query({ id: projectId });
      throw new Error('Project still exists after deletion');
    } catch (error) {
      // Expected error
    }
  });

  // === SUMMARY ===
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️  Total Duration: ${totalDuration}ms`);
  console.log(`📈 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
    process.exit(1);
  }

  console.log('\n✨ All tests passed!');
  process.exit(0);
}

runTests().catch((error) => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});
