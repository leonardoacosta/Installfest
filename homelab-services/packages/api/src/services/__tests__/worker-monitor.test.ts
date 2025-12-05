/**
 * Unit tests for WorkerMonitorService - Progress Metrics
 */

import { describe, test, expect } from 'bun:test';
import { WorkerMonitorService } from '../worker-monitor';

// Type definitions matching DB schema
type Hook = {
  id: string;
  sessionId: number;
  agentId: string | null;
  timestamp: Date | null;
  toolName: string | null;
  toolInput: string | null;
  toolOutput: string | null;
  success: boolean | null;
  durationMs: number | null;
  errorMessage: string | null;
};

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

describe('WorkerMonitorService - Progress Metrics', () => {
  describe('calculateProgressMetrics', () => {
    // Helper to create mock hooks
    const createMockHook = (overrides: Partial<Hook> = {}): Hook => ({
      id: Math.random().toString(),
      sessionId: 1,
      agentId: 'test-agent',
      timestamp: new Date(),
      toolName: 'Read',
      toolInput: '{}',
      toolOutput: '',
      success: true,
      durationMs: 100,
      errorMessage: null,
      ...overrides,
    });

    const createMockWorker = (overrides: Partial<Worker> = {}): Worker => ({
      id: 'test-worker',
      sessionId: 1,
      specId: 'test-spec',
      agentType: 'general-purpose',
      status: 'active',
      spawnedAt: new Date(Date.now() - 60000), // 1 minute ago
      startedAt: new Date(Date.now() - 50000),
      completedAt: null,
      result: null,
      retryCount: 0,
      errorMessage: null,
      ...overrides,
    });

    test('counts total tools executed correctly', () => {
      const monitor = new WorkerMonitorService({} as any);
      const worker = createMockWorker();
      const hooks = [
        createMockHook(),
        createMockHook(),
        createMockHook(),
      ];

      const metrics = (monitor as any).calculateProgressMetrics(worker, hooks);

      expect(metrics.toolsExecuted).toBe(3);
    });

    test('calculates success rate correctly', () => {
      const monitor = new WorkerMonitorService({} as any);
      const worker = createMockWorker();
      const hooks = [
        createMockHook({ success: true }),
        createMockHook({ success: true }),
        createMockHook({ success: false }),
        createMockHook({ success: true }),
      ];

      const metrics = (monitor as any).calculateProgressMetrics(worker, hooks);

      expect(metrics.toolsExecuted).toBe(4);
      expect(metrics.successRate).toBe(75); // 3/4 = 75%
    });

    test('extracts files changed from Edit tools', () => {
      const monitor = new WorkerMonitorService({} as any);
      const worker = createMockWorker();
      const hooks = [
        createMockHook({
          toolName: 'Edit',
          toolInput: JSON.stringify({ file_path: '/path/to/file1.ts', old_string: 'a', new_string: 'b' }),
        }),
        createMockHook({
          toolName: 'Edit',
          toolInput: JSON.stringify({ file_path: '/path/to/file2.ts', old_string: 'x', new_string: 'y' }),
        }),
        createMockHook({
          toolName: 'Read',
          toolInput: JSON.stringify({ file_path: '/path/to/file3.ts' }),
        }),
      ];

      const metrics = (monitor as any).calculateProgressMetrics(worker, hooks);

      expect(metrics.filesChanged).toContain('/path/to/file1.ts');
      expect(metrics.filesChanged).toContain('/path/to/file2.ts');
      expect(metrics.filesChanged).not.toContain('/path/to/file3.ts'); // Read doesn't count
      expect(metrics.filesChanged.length).toBe(2);
    });

    test('extracts files changed from Write tools', () => {
      const monitor = new WorkerMonitorService({} as any);
      const worker = createMockWorker();
      const hooks = [
        createMockHook({
          toolName: 'Write',
          toolInput: JSON.stringify({ file_path: '/path/to/newfile.ts', content: 'content' }),
        }),
        createMockHook({
          toolName: 'Edit',
          toolInput: JSON.stringify({ file_path: '/path/to/editfile.ts', old_string: 'a', new_string: 'b' }),
        }),
      ];

      const metrics = (monitor as any).calculateProgressMetrics(worker, hooks);

      expect(metrics.filesChanged).toContain('/path/to/newfile.ts');
      expect(metrics.filesChanged).toContain('/path/to/editfile.ts');
      expect(metrics.filesChanged.length).toBe(2);
    });

    test('deduplicates file paths', () => {
      const monitor = new WorkerMonitorService({} as any);
      const worker = createMockWorker();
      const hooks = [
        createMockHook({
          toolName: 'Edit',
          toolInput: JSON.stringify({ file_path: '/path/to/file.ts', old_string: 'a', new_string: 'b' }),
        }),
        createMockHook({
          toolName: 'Edit',
          toolInput: JSON.stringify({ file_path: '/path/to/file.ts', old_string: 'b', new_string: 'c' }),
        }),
        createMockHook({
          toolName: 'Write',
          toolInput: JSON.stringify({ file_path: '/path/to/file.ts', content: 'new content' }),
        }),
      ];

      const metrics = (monitor as any).calculateProgressMetrics(worker, hooks);

      expect(metrics.filesChanged).toEqual(['/path/to/file.ts']);
      expect(metrics.filesChanged.length).toBe(1);
    });

    test('detects test executions from Bash tool with vitest', () => {
      const monitor = new WorkerMonitorService({} as any);
      const worker = createMockWorker();
      const hooks = [
        createMockHook({
          toolName: 'Bash',
          toolInput: JSON.stringify({ command: 'bun test' }),
          success: true,
        }),
        createMockHook({
          toolName: 'Bash',
          toolInput: JSON.stringify({ command: 'vitest run' }),
          success: true,
        }),
      ];

      const metrics = (monitor as any).calculateProgressMetrics(worker, hooks);

      expect(metrics.testsRun).toBe(2);
      expect(metrics.testsPassed).toBe(2);
    });

    test('detects test executions from Bash tool with jest', () => {
      const monitor = new WorkerMonitorService({} as any);
      const worker = createMockWorker();
      const hooks = [
        createMockHook({
          toolName: 'Bash',
          toolInput: JSON.stringify({ command: 'npm run test' }),
          success: true,
        }),
        createMockHook({
          toolName: 'Bash',
          toolInput: JSON.stringify({ command: 'jest --coverage' }),
          success: false,
        }),
      ];

      const metrics = (monitor as any).calculateProgressMetrics(worker, hooks);

      expect(metrics.testsRun).toBe(2);
      expect(metrics.testsPassed).toBe(1); // Only first one succeeded
    });

    test('detects test executions from Bash tool with playwright', () => {
      const monitor = new WorkerMonitorService({} as any);
      const worker = createMockWorker();
      const hooks = [
        createMockHook({
          toolName: 'Bash',
          toolInput: JSON.stringify({ command: 'playwright test' }),
          success: true,
        }),
      ];

      const metrics = (monitor as any).calculateProgressMetrics(worker, hooks);

      expect(metrics.testsRun).toBe(1);
      expect(metrics.testsPassed).toBe(1);
    });

    test('does not count non-test Bash commands', () => {
      const monitor = new WorkerMonitorService({} as any);
      const worker = createMockWorker();
      const hooks = [
        createMockHook({
          toolName: 'Bash',
          toolInput: JSON.stringify({ command: 'ls -la' }),
          success: true,
        }),
        createMockHook({
          toolName: 'Bash',
          toolInput: JSON.stringify({ command: 'echo "Hello World"' }),
          success: true,
        }),
      ];

      const metrics = (monitor as any).calculateProgressMetrics(worker, hooks);

      expect(metrics.testsRun).toBe(0);
      expect(metrics.testsPassed).toBeNull();
    });

    test('calculates elapsed time correctly', () => {
      const monitor = new WorkerMonitorService({} as any);
      const spawnedAt = new Date(Date.now() - 120000); // 2 minutes ago
      const worker = createMockWorker({
        spawnedAt,
        startedAt: new Date(Date.now() - 110000),
        completedAt: null,
      });

      const metrics = (monitor as any).calculateProgressMetrics(worker, []);

      expect(metrics.elapsedMs).toBeGreaterThanOrEqual(120000);
      expect(metrics.elapsedMs).toBeLessThan(130000); // Allow some time for test execution
    });

    test('calculates elapsed time from completion timestamp when completed', () => {
      const monitor = new WorkerMonitorService({} as any);
      const spawnedAt = new Date(Date.now() - 300000); // 5 minutes ago
      const completedAt = new Date(Date.now() - 60000); // 1 minute ago
      const worker = createMockWorker({
        spawnedAt,
        startedAt: new Date(Date.now() - 290000),
        completedAt,
        status: 'completed',
      });

      const metrics = (monitor as any).calculateProgressMetrics(worker, []);

      // Should calculate from spawnedAt to completedAt
      const expectedElapsed = completedAt.getTime() - spawnedAt.getTime();
      expect(metrics.elapsedMs).toBeCloseTo(expectedElapsed, -2); // Within 100ms
    });

    test('tracks last activity timestamp', () => {
      const monitor = new WorkerMonitorService({} as any);
      const worker = createMockWorker();
      const latestTimestamp = new Date();
      const hooks = [
        createMockHook({ timestamp: latestTimestamp }),
        createMockHook({ timestamp: new Date(Date.now() - 60000) }),
        createMockHook({ timestamp: new Date(Date.now() - 120000) }),
      ];

      const metrics = (monitor as any).calculateProgressMetrics(worker, hooks);

      expect(metrics.lastActivityAt).toEqual(latestTimestamp);
    });

    test('tracks current tool from latest hook', () => {
      const monitor = new WorkerMonitorService({} as any);
      const worker = createMockWorker();
      const hooks = [
        createMockHook({ toolName: 'Edit' }),
        createMockHook({ toolName: 'Bash' }),
        createMockHook({ toolName: 'Read' }),
      ];

      const metrics = (monitor as any).calculateProgressMetrics(worker, hooks);

      expect(metrics.currentTool).toBe('Edit'); // Latest hook
    });

    test('handles empty hooks gracefully', () => {
      const monitor = new WorkerMonitorService({} as any);
      const worker = createMockWorker();

      const metrics = (monitor as any).calculateProgressMetrics(worker, []);

      expect(metrics.toolsExecuted).toBe(0);
      expect(metrics.successRate).toBe(0);
      expect(metrics.filesChanged).toEqual([]);
      expect(metrics.testsRun).toBe(0);
      expect(metrics.testsPassed).toBeNull();
      expect(metrics.lastActivityAt).toBeNull();
      expect(metrics.currentTool).toBeNull();
    });

    test('handles malformed toolInput JSON gracefully', () => {
      const monitor = new WorkerMonitorService({} as any);
      const worker = createMockWorker();
      const hooks = [
        createMockHook({
          toolName: 'Edit',
          toolInput: 'invalid json{',
        }),
        createMockHook({
          toolName: 'Bash',
          toolInput: 'not json at all',
        }),
      ];

      const metrics = (monitor as any).calculateProgressMetrics(worker, hooks);

      // Should not throw, and should handle gracefully
      expect(metrics.filesChanged).toEqual([]);
      expect(metrics.testsRun).toBe(0);
    });
  });
});
