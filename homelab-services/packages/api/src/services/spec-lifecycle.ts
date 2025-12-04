import { db, openspecSpecs, specLifecycle, appliedSpecs } from '@homelab/db';
import { type SpecStatus, type TriggerType } from '@homelab/validators';
import { eq, and, desc } from 'drizzle-orm';
import { TransitionRulesEngine } from './transition-rules';
import { WorkQueueService } from './work-queue';
import { workQueueEvents } from '../router/work-queue';

export class SpecLifecycleService {
  private rulesEngine: TransitionRulesEngine;

  constructor() {
    this.rulesEngine = new TransitionRulesEngine();
  }

  /**
   * Get current state of a spec
   */
  async getCurrentState(specId: string): Promise<SpecStatus | null> {
    const spec = await db.query.openspecSpecs.findFirst({
      where: eq(openspecSpecs.id, specId),
    });

    return spec ? (spec.status as SpecStatus) : null;
  }

  /**
   * Get state history for a spec
   */
  async getStateHistory(specId: string) {
    return await db.query.specLifecycle.findMany({
      where: eq(specLifecycle.specId, specId),
      orderBy: desc(specLifecycle.transitionedAt),
    });
  }

  /**
   * Check if transition is allowed
   */
  async canTransition(specId: string, toState: SpecStatus) {
    return await this.rulesEngine.canTransition(specId, toState);
  }

  /**
   * Transition spec to a new state
   */
  async transitionState(
    specId: string,
    toState: SpecStatus,
    triggeredBy: TriggerType,
    notes?: string,
    triggerUserId?: number,
    triggerSessionId?: number
  ): Promise<void> {
    // Validate transition
    const validation = await this.canTransition(specId, toState);

    if (!validation.allowed) {
      throw new Error(validation.reason || 'Transition not allowed');
    }

    const fromState = validation.currentState!;

    // Check manual gate requirement
    if (this.rulesEngine.isManualGate(fromState, toState) && triggeredBy !== 'user') {
      throw new Error(`Transition from ${fromState} to ${toState} requires user approval`);
    }

    // Perform transition in transaction
    await db.transaction(async (tx) => {
      // Update spec status
      await tx.update(openspecSpecs)
        .set({
          status: toState,
          statusChangedAt: new Date(),
          statusChangedBy: triggerUserId
            ? `user:${triggerUserId}`
            : triggerSessionId
            ? `session:${triggerSessionId}`
            : 'system',
          updatedAt: new Date(),
        })
        .where(eq(openspecSpecs.id, specId));

      // Record transition in history
      await tx.insert(specLifecycle).values({
        specId,
        fromState,
        toState,
        triggeredBy,
        triggerUserId,
        triggerSessionId,
        notes,
      });
    });
  }

  /**
   * Approve a spec (proposing → approved)
   */
  async approve(specId: string, userId?: number): Promise<void> {
    await this.transitionState(specId, 'approved', 'user', 'Spec approved', userId);

    // Add to work queue after approval
    const spec = await db.query.openspecSpecs.findFirst({
      where: eq(openspecSpecs.id, specId),
    });

    if (spec) {
      const workQueueService = new WorkQueueService(db);
      try {
        const workItem = await workQueueService.addToQueue(
          spec.projectId,
          specId
        );

        // Emit event
        workQueueEvents.emit('item_added', {
          type: 'item_added',
          projectId: spec.projectId,
          workItemId: workItem.id,
          item: workItem,
        });
      } catch (error) {
        console.error(`Failed to add spec ${specId} to work queue:`, error);
        // Don't fail the approval if work queue add fails
      }
    }
  }

  /**
   * Reject a spec (any state → proposing)
   */
  async reject(specId: string, reason: string, userId?: number): Promise<void> {
    await this.transitionState(
      specId,
      'proposing',
      'user',
      `Rejected: ${reason}`,
      userId
    );
  }

  /**
   * Mark spec as applied (review → applied)
   */
  async markApplied(
    specId: string,
    projectId: number,
    appliedBy?: number,
    verificationNotes?: string,
    userId?: number
  ): Promise<void> {
    await db.transaction(async (tx) => {
      // Transition spec to applied state
      await this.transitionState(
        specId,
        'applied',
        'user',
        verificationNotes,
        userId
      );

      // Record in appliedSpecs table
      await tx.insert(appliedSpecs).values({
        specId,
        projectId,
        appliedAt: new Date(),
        appliedBy,
        verificationStatus: 'pending',
        verificationNotes,
      });
    });

    // Check and unblock dependent work items
    const workQueueService = new WorkQueueService(db);
    try {
      await workQueueService.checkAndUnblockDependents(specId);
    } catch (error) {
      console.error(`Failed to unblock dependents for spec ${specId}:`, error);
      // Don't fail if unblocking fails
    }
  }

  /**
   * Update verification status for an applied spec
   */
  async updateVerification(
    specId: string,
    projectId: number,
    status: 'tests_passed' | 'tests_failed',
    notes?: string
  ): Promise<void> {
    await db
      .update(appliedSpecs)
      .set({
        verificationStatus: status,
        verificationNotes: notes,
      })
      .where(
        and(
          eq(appliedSpecs.specId, specId),
          eq(appliedSpecs.projectId, projectId)
        )
      );
  }

  /**
   * Get all applied specs for a project
   */
  async getAppliedSpecs(projectId: number) {
    return await db.query.appliedSpecs.findMany({
      where: eq(appliedSpecs.projectId, projectId),
      with: {
        spec: true,
      },
    });
  }

  /**
   * Get all projects where a spec has been applied
   */
  async getSpecApplications(specId: string) {
    return await db.query.appliedSpecs.findMany({
      where: eq(appliedSpecs.specId, specId),
      with: {
        project: true,
      },
    });
  }

  /**
   * Trigger automatic transitions for all eligible specs
   */
  async triggerAutomaticTransitions(): Promise<void> {
    // Find all specs in in_progress state
    const inProgressSpecs = await db.query.openspecSpecs.findMany({
      where: eq(openspecSpecs.status, 'in_progress'),
    });

    for (const spec of inProgressSpecs) {
      try {
        const nextState = await this.rulesEngine.shouldAutoTransition(spec.id);

        if (nextState) {
          await this.transitionState(
            spec.id,
            nextState,
            'system',
            'All tasks marked complete'
          );

          console.log(`Auto-transitioned spec ${spec.id} from in_progress to ${nextState}`);
        }
      } catch (error) {
        console.error(`Error auto-transitioning spec ${spec.id}:`, error);
        // Continue to next spec, don't crash the job
      }
    }
  }

  /**
   * Check if spec requires user approval to proceed
   */
  async requiresUserApproval(specId: string): Promise<boolean> {
    const currentState = await this.getCurrentState(specId);
    if (!currentState) return false;

    const nextStates = this.rulesEngine.getNextStates(currentState);

    // Check if any of the next states require manual approval
    return nextStates.some(nextState =>
      this.rulesEngine.isManualGate(currentState, nextState)
    );
  }

  /**
   * Get task completion percentage for a spec
   */
  async getTasksCompletion(specId: string): Promise<number> {
    const spec = await db.query.openspecSpecs.findFirst({
      where: eq(openspecSpecs.id, specId),
    });

    if (!spec) return 0;

    return this.rulesEngine.getTasksCompletionPercentage(spec.tasksContent);
  }
}
