/**
 * Unit tests for WorkerAgentService - Retry Logic
 */

import { describe, test, expect } from 'bun:test';
import { WorkerAgentService } from '../worker-agent';

// Type definitions matching DB schema
type Worker = {
  id: string;
  sessionId: number;
  specId: string;
  agentType: string;
  status: string;
  spawnedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  result: any;
  retryCount: number;
  errorMessage: string | null;
};

type Spec = {
  id: string;
  title: string | null;
  status: string;
  priority: number;
  proposalContent: string | null;
  tasksContent: string | null;
  designContent: string | null;
  createdAt: Date;
  updatedAt: Date;
  projectId: number;
  changeId: string | null;
};

describe('WorkerAgentService - Retry Logic', () => {
  // Mock database that tracks operations
  class MockDB {
    private workers: Map<string, Worker> = new Map();
    private specs: Map<string, Spec> = new Map();

    constructor() {
      // Add a default spec
      this.specs.set('test-spec', {
        id: 'test-spec',
        title: 'Test Spec',
        status: 'approved',
        priority: 3,
        proposalContent: 'Test proposal',
        tasksContent: '- [ ] Task 1',
        designContent: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        projectId: 1,
        changeId: 'test-change',
      });
    }

    select() {
      return {
        from: (table: any) => {
          // Check table name instead of direct comparison
          const tableName = table?.name || table?.[Symbol.toStringTag];

          if (tableName === 'worker_agents' || table === 'workerAgents') {
            return {
              where: (condition: any) => ({
                get: () => {
                  // Return first matching worker
                  return Array.from(this.workers.values())[0] || null;
                },
              }),
            };
          }
          if (tableName === 'openspec_specs' || table === 'openspecSpecs') {
            return {
              where: (condition: any) => ({
                get: () => {
                  return this.specs.get('test-spec') || null;
                },
              }),
            };
          }
          // Default fallback
          return {
            where: (condition: any) => ({
              get: () => {
                // Try workers first, then specs
                const worker = Array.from(this.workers.values())[0];
                if (worker) return worker;
                return this.specs.get('test-spec') || null;
              },
            }),
          };
        },
      };
    }

    insert(table: any) {
      return {
        values: (data: any) => ({
          returning: () => {
            const worker = { ...data, id: data.id || `worker-${Date.now()}` };
            this.workers.set(worker.id, worker);
            return [worker];
          },
        }),
      };
    }

    addFailedWorker(retryCount: number) {
      const worker: Worker = {
        id: `failed-worker-${retryCount}`,
        sessionId: 1,
        specId: 'test-spec',
        agentType: 't3-stack-developer',
        status: 'failed',
        spawnedAt: new Date(),
        startedAt: new Date(),
        completedAt: new Date(),
        result: null,
        retryCount,
        errorMessage: 'Test error',
      };
      this.workers.set(worker.id, worker);
      return worker;
    }
  }

  test('first retry uses same agent type', async () => {
    const mockDB = new MockDB();
    const failedWorker = mockDB.addFailedWorker(0); // First failure, retryCount=0

    const service = new WorkerAgentService(mockDB as any, { mockMode: true });

    const retryWorker = await service.retryWorker(failedWorker.id);

    expect(retryWorker).not.toBeNull();
    expect(retryWorker!.agentType).toBe('t3-stack-developer'); // Same as original
    expect(retryWorker!.retryCount).toBe(1); // Incremented
  });

  test('second retry uses same agent type', async () => {
    const mockDB = new MockDB();
    const failedWorker = mockDB.addFailedWorker(1); // Second failure, retryCount=1

    const service = new WorkerAgentService(mockDB as any, { mockMode: true });

    const retryWorker = await service.retryWorker(failedWorker.id);

    expect(retryWorker).not.toBeNull();
    expect(retryWorker!.agentType).toBe('t3-stack-developer'); // Still same
    expect(retryWorker!.retryCount).toBe(2);
  });

  test('third retry uses same agent type', async () => {
    const mockDB = new MockDB();
    const failedWorker = mockDB.addFailedWorker(2); // Third failure, retryCount=2

    const service = new WorkerAgentService(mockDB as any, { mockMode: true });

    const retryWorker = await service.retryWorker(failedWorker.id);

    expect(retryWorker).not.toBeNull();
    expect(retryWorker!.agentType).toBe('t3-stack-developer'); // Still same
    expect(retryWorker!.retryCount).toBe(3);
  });

  test('fourth retry (after 3 failures) falls back to general-purpose', async () => {
    const mockDB = new MockDB();
    const failedWorker = mockDB.addFailedWorker(3); // Fourth failure, retryCount=3

    const service = new WorkerAgentService(mockDB as any, { mockMode: true });

    const retryWorker = await service.retryWorker(failedWorker.id);

    expect(retryWorker).not.toBeNull();
    expect(retryWorker!.agentType).toBe('general-purpose'); // Fallback
    expect(retryWorker!.retryCount).toBe(4);
  });

  test('after retry limit (>3), returns null for manual intervention', async () => {
    const mockDB = new MockDB();
    const failedWorker = mockDB.addFailedWorker(4); // Fifth failure, retryCount=4

    const service = new WorkerAgentService(mockDB as any, { mockMode: true });

    const retryWorker = await service.retryWorker(failedWorker.id);

    expect(retryWorker).toBeNull(); // Manual intervention required
  });

  test('forceAgentType overrides automatic selection', async () => {
    const mockDB = new MockDB();
    const failedWorker = mockDB.addFailedWorker(0);

    const service = new WorkerAgentService(mockDB as any, { mockMode: true });

    const retryWorker = await service.retryWorker(failedWorker.id, 'e2e-test-engineer');

    expect(retryWorker).not.toBeNull();
    expect(retryWorker!.agentType).toBe('e2e-test-engineer'); // Forced type
    expect(retryWorker!.retryCount).toBe(1);
  });

  test('forceAgentType allows retry beyond limit', async () => {
    const mockDB = new MockDB();
    const failedWorker = mockDB.addFailedWorker(5); // Beyond limit

    const service = new WorkerAgentService(mockDB as any, { mockMode: true });

    const retryWorker = await service.retryWorker(failedWorker.id, 'database-architect');

    expect(retryWorker).not.toBeNull();
    expect(retryWorker!.agentType).toBe('database-architect');
    expect(retryWorker!.retryCount).toBe(6);
  });

  test('throws error if worker not found', async () => {
    const mockDB = new MockDB();
    const service = new WorkerAgentService(mockDB as any, { mockMode: true });

    await expect(service.retryWorker('nonexistent-worker')).rejects.toThrow('Worker nonexistent-worker not found');
  });

  test('throws error if worker status is not failed', async () => {
    const mockDB = new MockDB();
    const activeWorker: Worker = {
      id: 'active-worker',
      sessionId: 1,
      specId: 'test-spec',
      agentType: 't3-stack-developer',
      status: 'active', // Not failed
      spawnedAt: new Date(),
      startedAt: new Date(),
      completedAt: null,
      result: null,
      retryCount: 0,
      errorMessage: null,
    };
    mockDB['workers'].set(activeWorker.id, activeWorker);

    const service = new WorkerAgentService(mockDB as any, { mockMode: true });

    await expect(service.retryWorker('active-worker')).rejects.toThrow('is not failed');
  });

  test('buildRetryPrompt includes previous failure context', async () => {
    const mockDB = new MockDB();
    const failedWorker = mockDB.addFailedWorker(1);

    const service = new WorkerAgentService(mockDB as any, { mockMode: true });

    // Access private method via type casting
    const spec = mockDB['specs'].get('test-spec')!;
    const prompt = (service as any).buildRetryPrompt(spec, 't3-stack-developer', failedWorker);

    expect(prompt).toContain('RETRY');
    expect(prompt).toContain('Retry Attempt');
    expect(prompt).toContain('Previous Failure');
    expect(prompt).toContain('Test error'); // Error message
  });

  test('retry increments retryCount correctly', async () => {
    const mockDB = new MockDB();

    // Test progression: 0 -> 1 -> 2 -> 3 -> 4 (fallback) -> null
    for (let i = 0; i < 4; i++) {
      mockDB['workers'].clear();
      const failedWorker = mockDB.addFailedWorker(i);
      const service = new WorkerAgentService(mockDB as any, { mockMode: true });

      const retryWorker = await service.retryWorker(failedWorker.id);

      expect(retryWorker).not.toBeNull();
      expect(retryWorker!.retryCount).toBe(i + 1);
    }

    // After 4 retries (retryCount=4), should return null
    mockDB['workers'].clear();
    const finalFailure = mockDB.addFailedWorker(4);
    const service = new WorkerAgentService(mockDB as any, { mockMode: true });
    const finalRetry = await service.retryWorker(finalFailure.id);

    expect(finalRetry).toBeNull();
  });

  test('retry maintains sessionId and specId', async () => {
    const mockDB = new MockDB();
    const failedWorker = mockDB.addFailedWorker(1);

    const service = new WorkerAgentService(mockDB as any, { mockMode: true });

    const retryWorker = await service.retryWorker(failedWorker.id);

    expect(retryWorker).not.toBeNull();
    expect(retryWorker!.sessionId).toBe(failedWorker.sessionId);
    expect(retryWorker!.specId).toBe(failedWorker.specId);
  });
});
