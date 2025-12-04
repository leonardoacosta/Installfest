import { eq, and, desc } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { workerAgents, openspecSpecs, sessions } from '@homelab/db';
import type { AgentType, WorkerAgentConfig } from '@homelab/validators';
import { WorkerSelectorService } from './worker-selector';
import { TaskToolClient } from '../utils/task-tool';

/**
 * Worker Agent Management Service
 * Handles spawning, tracking, and managing worker agents
 */
export class WorkerAgentService {
  private selectorService: WorkerSelectorService;
  private taskTool: TaskToolClient;

  constructor(
    private db: LibSQLDatabase<any>,
    options: { mockMode?: boolean } = {}
  ) {
    this.selectorService = new WorkerSelectorService();
    this.taskTool = new TaskToolClient({ mockMode: options.mockMode });
  }

  /**
   * Spawn a new worker agent for a spec
   */
  async spawnWorker(config: WorkerAgentConfig): Promise<typeof workerAgents.$inferSelect> {
    const { sessionId, specId, agentType: providedAgentType } = config;

    // Verify session exists and has authority
    const session = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .get();

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (session.currentWorkItemId === null) {
      throw new Error(`Session ${sessionId} has no assigned work item`);
    }

    // Verify spec exists
    const spec = await this.db
      .select()
      .from(openspecSpecs)
      .where(eq(openspecSpecs.id, specId))
      .get();

    if (!spec) {
      throw new Error(`Spec ${specId} not found`);
    }

    // Select agent type if not provided
    const agentType = providedAgentType ?? this.selectorService.selectAgentType(spec).agentType;

    // Build worker prompt
    const prompt = this.buildWorkerPrompt(spec, agentType);
    const description = `Implement spec: ${spec.title}`;

    // Call Task tool to spawn agent
    const result = await this.taskTool.callTaskTool(agentType, prompt, description);

    if (!result.success || !result.agentId) {
      throw new Error(`Failed to spawn worker: ${result.error ?? 'Unknown error'}`);
    }

    // Create worker record
    const [worker] = await this.db
      .insert(workerAgents)
      .values({
        id: result.agentId,
        sessionId,
        specId,
        agentType,
        status: 'spawned',
      })
      .returning();

    console.log('[WorkerAgent] Spawned worker', {
      workerId: worker.id,
      sessionId,
      specId,
      agentType,
    });

    // TODO: Emit subscription event: worker_spawned

    return worker;
  }

  /**
   * Build the prompt for a worker agent
   */
  buildWorkerPrompt(
    spec: typeof openspecSpecs.$inferSelect,
    agentType: AgentType
  ): string {
    const sections: string[] = [];

    // Header
    sections.push(`# Worker Agent Task: ${spec.title}`);
    sections.push('');
    sections.push(`**Spec ID**: ${spec.id}`);
    sections.push(`**Agent Type**: ${agentType}`);
    sections.push('');

    // Why section
    if (spec.proposalContent) {
      // Extract "Why" section from proposal
      const whyMatch = spec.proposalContent.match(/## Why\n\n([\s\S]*?)(?=\n## |\n---|\z)/);
      if (whyMatch) {
        sections.push('## Why This Change');
        sections.push('');
        sections.push(whyMatch[1]?.trim() ?? '');
        sections.push('');
      }
    }

    // What Changes section
    if (spec.proposalContent) {
      const whatMatch = spec.proposalContent.match(/## What Changes\n\n([\s\S]*?)(?=\n## |\n---|\z)/);
      if (whatMatch) {
        sections.push('## What Changes');
        sections.push('');
        sections.push(whatMatch[1]?.trim() ?? '');
        sections.push('');
      }
    }

    // Tasks
    if (spec.tasksContent) {
      sections.push('## Tasks to Complete');
      sections.push('');
      sections.push(spec.tasksContent.trim());
      sections.push('');
    }

    // Design (if available)
    if (spec.designContent) {
      sections.push('## Design Details');
      sections.push('');
      sections.push(spec.designContent.trim());
      sections.push('');
    }

    // Instructions
    sections.push('## Instructions');
    sections.push('');
    sections.push('1. Read and understand all tasks listed above');
    sections.push('2. Complete each task marked with `[ ]`');
    sections.push('3. Update task checkboxes to `[x]` as you complete them');
    sections.push('4. Test your changes thoroughly');
    sections.push('5. If you encounter errors, report them clearly with context');
    sections.push('6. When all tasks are complete, report completion');
    sections.push('');
    sections.push('**Project Root**: `homelab-services/`');
    sections.push('**Key Paths**:');
    sections.push('- Database schema: `packages/db/src/schema/`');
    sections.push('- Validators: `packages/validators/src/`');
    sections.push('- Services: `packages/api/src/services/`');
    sections.push('- tRPC routers: `packages/api/src/router/`');
    sections.push('- Web app: `apps/claude-agent-web/`');
    sections.push('');
    sections.push('Begin implementation now.');

    return sections.join('\n');
  }

  /**
   * Get worker status
   */
  async getWorkerStatus(workerId: string): Promise<typeof workerAgents.$inferSelect | undefined> {
    return this.db
      .select()
      .from(workerAgents)
      .where(eq(workerAgents.id, workerId))
      .get();
  }

  /**
   * Cancel a worker
   */
  async cancelWorker(workerId: string): Promise<typeof workerAgents.$inferSelect> {
    // Cancel via Task tool
    await this.taskTool.cancelAgent(workerId);

    // Update status
    const [updated] = await this.db
      .update(workerAgents)
      .set({
        status: 'cancelled',
        completedAt: new Date(),
      })
      .where(eq(workerAgents.id, workerId))
      .returning();

    console.log('[WorkerAgent] Cancelled worker', { workerId });

    // TODO: Emit subscription event: worker_cancelled

    return updated;
  }

  /**
   * Mark worker as complete
   */
  async markWorkerComplete(
    workerId: string,
    result: {
      filesChanged?: string[];
      testsRun?: number;
      testsPassed?: number;
      errors?: string[];
    }
  ): Promise<typeof workerAgents.$inferSelect> {
    const [updated] = await this.db
      .update(workerAgents)
      .set({
        status: 'completed',
        completedAt: new Date(),
        result: JSON.stringify(result),
      })
      .where(eq(workerAgents.id, workerId))
      .returning();

    console.log('[WorkerAgent] Worker completed', { workerId, result });

    // TODO: Emit subscription event: worker_completed
    // TODO: Trigger spec lifecycle transition to 'review'

    return updated;
  }

  /**
   * Mark worker as failed
   */
  async markWorkerFailed(workerId: string, errorMessage: string): Promise<typeof workerAgents.$inferSelect> {
    const [updated] = await this.db
      .update(workerAgents)
      .set({
        status: 'failed',
        completedAt: new Date(),
        errorMessage,
      })
      .where(eq(workerAgents.id, workerId))
      .returning();

    console.log('[WorkerAgent] Worker failed', { workerId, errorMessage });

    // TODO: Emit subscription event: worker_failed
    // TODO: Trigger retry logic

    return updated;
  }

  /**
   * List active workers
   */
  async listActive(filter: {
    projectId?: number;
    sessionId?: number;
    specId?: string;
    limit?: number;
  }): Promise<Array<typeof workerAgents.$inferSelect>> {
    let query = this.db.select().from(workerAgents);

    // Apply filters
    const conditions = [];
    if (filter.sessionId !== undefined) {
      conditions.push(eq(workerAgents.sessionId, filter.sessionId));
    }
    if (filter.specId !== undefined) {
      conditions.push(eq(workerAgents.specId, filter.specId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query
      .orderBy(desc(workerAgents.spawnedAt))
      .limit(filter.limit ?? 50)
      .all();

    return results;
  }

  /**
   * Get all workers for a session
   */
  async getWorkersForSession(sessionId: number): Promise<Array<typeof workerAgents.$inferSelect>> {
    return this.db
      .select()
      .from(workerAgents)
      .where(eq(workerAgents.sessionId, sessionId))
      .orderBy(desc(workerAgents.spawnedAt))
      .all();
  }

  /**
   * Retry a failed worker
   * - If retryCount < 3: Use same agent type
   * - If retryCount >= 3: Try general-purpose fallback
   * - If all retries exhausted: Return null (requires manual intervention)
   */
  async retryWorker(
    workerId: string,
    forceAgentType?: AgentType
  ): Promise<typeof workerAgents.$inferSelect | null> {
    // Get failed worker
    const failedWorker = await this.db
      .select()
      .from(workerAgents)
      .where(eq(workerAgents.id, workerId))
      .get();

    if (!failedWorker) {
      throw new Error(`Worker ${workerId} not found`);
    }

    if (failedWorker.status !== 'failed') {
      throw new Error(`Worker ${workerId} is not failed (status: ${failedWorker.status})`);
    }

    // Check if retries exhausted
    if (failedWorker.retryCount >= 3 && !forceAgentType) {
      console.log('[WorkerAgent] Retry limit reached', { workerId });
      // TODO: Create clarification request for manual intervention
      return null;
    }

    // Determine agent type for retry
    let retryAgentType: AgentType;
    if (forceAgentType) {
      retryAgentType = forceAgentType;
    } else if (failedWorker.retryCount < 3) {
      // Use same agent type
      retryAgentType = failedWorker.agentType as AgentType;
    } else {
      // Fallback to general-purpose
      retryAgentType = 'general-purpose';
    }

    console.log('[WorkerAgent] Retrying worker', {
      workerId,
      attempt: failedWorker.retryCount + 1,
      agentType: retryAgentType,
    });

    // Spawn new worker with incremented retry count
    const spec = await this.db
      .select()
      .from(openspecSpecs)
      .where(eq(openspecSpecs.id, failedWorker.specId))
      .get();

    if (!spec) {
      throw new Error(`Spec ${failedWorker.specId} not found`);
    }

    // Build retry prompt (includes previous failure context)
    const prompt = this.buildRetryPrompt(spec, retryAgentType, failedWorker);
    const description = `Retry implementing spec: ${spec.title}`;

    // Call Task tool
    const result = await this.taskTool.callTaskTool(retryAgentType, prompt, description);

    if (!result.success || !result.agentId) {
      throw new Error(`Failed to spawn retry worker: ${result.error ?? 'Unknown error'}`);
    }

    // Create new worker with incremented retry count
    const [newWorker] = await this.db
      .insert(workerAgents)
      .values({
        id: result.agentId,
        sessionId: failedWorker.sessionId,
        specId: failedWorker.specId,
        agentType: retryAgentType,
        status: 'spawned',
        retryCount: failedWorker.retryCount + 1,
      })
      .returning();

    console.log('[WorkerAgent] Retry worker spawned', {
      newWorkerId: newWorker.id,
      originalWorkerId: workerId,
      retryCount: newWorker.retryCount,
    });

    // TODO: Emit subscription event: worker_retry_spawned

    return newWorker;
  }

  /**
   * Build prompt for retry attempt, including previous failure context
   */
  private buildRetryPrompt(
    spec: typeof openspecSpecs.$inferSelect,
    agentType: AgentType,
    failedWorker: typeof workerAgents.$inferSelect
  ): string {
    const sections: string[] = [];

    // Header
    sections.push(`# Worker Agent Task (RETRY): ${spec.title}`);
    sections.push('');
    sections.push(`**Spec ID**: ${spec.id}`);
    sections.push(`**Agent Type**: ${agentType}`);
    sections.push(`**Retry Attempt**: ${failedWorker.retryCount + 1}`);
    sections.push('');

    // Previous failure context
    sections.push('## Previous Failure');
    sections.push('');
    sections.push(`The previous worker failed with error:`);
    sections.push('```');
    sections.push(failedWorker.errorMessage ?? 'Unknown error');
    sections.push('```');
    sections.push('');
    sections.push('Please review the error above and adjust your approach accordingly.');
    sections.push('');

    // Include original prompt content
    const originalPrompt = this.buildWorkerPrompt(spec, agentType);
    sections.push(originalPrompt);

    return sections.join('\n');
  }
}
