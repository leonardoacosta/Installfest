import { eq, and, isNull, desc, asc } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { workQueue, openspecSpecs, sessions } from '@homelab/db';
import type { WorkQueueItem, WorkQueueFilter } from '@homelab/validators';

/**
 * Work Queue Management Service
 * Handles prioritized work queue for OpenSpec items
 */
export class WorkQueueService {
  constructor(private db: LibSQLDatabase<any>) {}

  /**
   * Add an approved spec to the work queue
   */
  async addToQueue(
    projectId: number,
    specId: string,
    priority?: number
  ): Promise<WorkQueueItem> {
    // Verify spec exists and is approved
    const spec = await this.db
      .select()
      .from(openspecSpecs)
      .where(eq(openspecSpecs.id, specId))
      .get();

    if (!spec) {
      throw new Error(`Spec ${specId} not found`);
    }

    if (spec.status !== 'approved') {
      throw new Error(`Spec ${specId} must be approved to add to queue (current: ${spec.status})`);
    }

    // Find max position for this project
    const maxPositionResult = await this.db
      .select({ maxPosition: workQueue.position })
      .from(workQueue)
      .where(eq(workQueue.projectId, projectId))
      .orderBy(desc(workQueue.position))
      .limit(1)
      .get();

    const nextPosition = (maxPositionResult?.maxPosition ?? -1) + 1;

    // Calculate priority if not provided
    const calculatedPriority = priority ?? this.calculatePriority(spec);

    // Insert work item
    const result = await this.db
      .insert(workQueue)
      .values({
        projectId,
        specId,
        priority: calculatedPriority,
        position: nextPosition,
        status: 'queued',
      })
      .returning()
      .get();

    return result as WorkQueueItem;
  }

  /**
   * Remove item from work queue
   */
  async removeFromQueue(workItemId: number): Promise<void> {
    const result = await this.db
      .delete(workQueue)
      .where(eq(workQueue.id, workItemId))
      .returning()
      .get();

    if (!result) {
      throw new Error(`Work item ${workItemId} not found`);
    }
  }

  /**
   * Get work queue for a project with optional filters
   */
  async getQueue(
    projectId: number,
    filter?: WorkQueueFilter
  ): Promise<Array<WorkQueueItem & { specTitle: string }>> {
    let query = this.db
      .select({
        id: workQueue.id,
        projectId: workQueue.projectId,
        specId: workQueue.specId,
        priority: workQueue.priority,
        position: workQueue.position,
        status: workQueue.status,
        blockedBy: workQueue.blockedBy,
        addedAt: workQueue.addedAt,
        assignedAt: workQueue.assignedAt,
        completedAt: workQueue.completedAt,
        specTitle: openspecSpecs.title,
      })
      .from(workQueue)
      .leftJoin(openspecSpecs, eq(workQueue.specId, openspecSpecs.id))
      .where(eq(workQueue.projectId, projectId))
      .orderBy(desc(workQueue.priority), asc(workQueue.position));

    const results = await query.all();
    return results as Array<WorkQueueItem & { specTitle: string }>;
  }

  /**
   * Calculate priority for a spec based on classification and age
   */
  calculatePriority(spec: any): number {
    let basePriority = 3; // Default for user-created specs

    // Try to detect classification from proposal content
    const content = spec.proposalContent?.toLowerCase() || '';
    if (content.includes('persistent')) basePriority = 5;
    else if (content.includes('recurring')) basePriority = 4;
    else if (content.includes('flaky')) basePriority = 3;
    else if (content.includes('new')) basePriority = 2;

    // Age bonus: +1 per week (capped at 5)
    const ageInDays = spec.addedAt
      ? Math.floor((Date.now() - new Date(spec.addedAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    const ageBonus = Math.min(Math.floor(ageInDays / 7), 2); // Max +2 for age

    return Math.min(basePriority + ageBonus, 5);
  }

  /**
   * Reorder work queue items
   */
  async reorderQueue(
    projectId: number,
    newOrder: Array<{ workItemId: number; newPosition: number }>
  ): Promise<void> {
    // Verify all items belong to the same project
    const itemIds = newOrder.map((item) => item.workItemId);
    const items = await this.db
      .select()
      .from(workQueue)
      .where(eq(workQueue.projectId, projectId))
      .all();

    const validIds = new Set(items.map((item) => item.id));
    const invalidIds = itemIds.filter((id) => !validIds.has(id));

    if (invalidIds.length > 0) {
      throw new Error(
        `Work items [${invalidIds.join(', ')}] do not belong to project ${projectId}`
      );
    }

    // Update positions in a transaction
    await this.db.batch(
      newOrder.map((item) =>
        this.db
          .update(workQueue)
          .set({ position: item.newPosition })
          .where(eq(workQueue.id, item.workItemId))
      )
    );
  }

  /**
   * Assign a work item to a session
   */
  async assignWorkItem(workItemId: number, sessionId: number): Promise<void> {
    // Verify work item exists and is queued
    const item = await this.db
      .select()
      .from(workQueue)
      .where(eq(workQueue.id, workItemId))
      .get();

    if (!item) {
      throw new Error(`Work item ${workItemId} not found`);
    }

    if (item.status !== 'queued') {
      throw new Error(`Work item must be queued to assign (current: ${item.status})`);
    }

    // Verify session exists
    const session = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .get();

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Update work item and session in transaction
    await this.db.batch([
      this.db
        .update(workQueue)
        .set({
          status: 'assigned',
          assignedAt: new Date(),
        })
        .where(eq(workQueue.id, workItemId)),
      this.db
        .update(sessions)
        .set({ currentWorkItemId: workItemId })
        .where(eq(sessions.id, sessionId)),
    ]);
  }

  /**
   * Complete a work item
   */
  async completeWorkItem(workItemId: number): Promise<void> {
    const result = await this.db
      .update(workQueue)
      .set({
        status: 'completed',
        completedAt: new Date(),
      })
      .where(eq(workQueue.id, workItemId))
      .returning()
      .get();

    if (!result) {
      throw new Error(`Work item ${workItemId} not found`);
    }

    // Check and unblock dependents
    await this.checkAndUnblockDependents(result.specId);
  }

  /**
   * Block a work item with a dependency
   */
  async blockWorkItem(workItemId: number, blockedBySpecId: string): Promise<void> {
    // Verify both specs exist
    const [item, blockerSpec] = await Promise.all([
      this.db
        .select()
        .from(workQueue)
        .where(eq(workQueue.id, workItemId))
        .get(),
      this.db
        .select()
        .from(openspecSpecs)
        .where(eq(openspecSpecs.id, blockedBySpecId))
        .get(),
    ]);

    if (!item) {
      throw new Error(`Work item ${workItemId} not found`);
    }

    if (!blockerSpec) {
      throw new Error(`Blocker spec ${blockedBySpecId} not found`);
    }

    // If blocker is already applied, don't block
    if (blockerSpec.status === 'applied') {
      return;
    }

    // Update work item
    await this.db
      .update(workQueue)
      .set({
        status: 'blocked',
        blockedBy: blockedBySpecId,
      })
      .where(eq(workQueue.id, workItemId));
  }

  /**
   * Unblock a work item
   */
  async unblockWorkItem(workItemId: number): Promise<void> {
    await this.db
      .update(workQueue)
      .set({
        status: 'queued',
        blockedBy: null,
      })
      .where(eq(workQueue.id, workItemId));
  }

  /**
   * Check and unblock items waiting on a completed spec
   */
  async checkAndUnblockDependents(specId: string): Promise<void> {
    // Find all items blocked by this spec
    const blockedItems = await this.db
      .select()
      .from(workQueue)
      .where(eq(workQueue.blockedBy, specId))
      .all();

    if (blockedItems.length === 0) {
      return;
    }

    // Unblock all dependent items
    await this.db.batch(
      blockedItems.map((item) =>
        this.db
          .update(workQueue)
          .set({
            status: 'queued',
            blockedBy: null,
          })
          .where(eq(workQueue.id, item.id))
      )
    );
  }

  /**
   * Get work queue statistics for a project
   */
  async getStats(projectId: number): Promise<{
    totalQueued: number;
    totalAssigned: number;
    totalBlocked: number;
    totalCompleted: number;
    highestPriority: number;
  }> {
    const items = await this.db
      .select()
      .from(workQueue)
      .where(eq(workQueue.projectId, projectId))
      .all();

    const stats = {
      totalQueued: items.filter((item) => item.status === 'queued').length,
      totalAssigned: items.filter((item) => item.status === 'assigned').length,
      totalBlocked: items.filter((item) => item.status === 'blocked').length,
      totalCompleted: items.filter((item) => item.status === 'completed').length,
      highestPriority: Math.max(...items.map((item) => item.priority), 0),
    };

    return stats;
  }
}
