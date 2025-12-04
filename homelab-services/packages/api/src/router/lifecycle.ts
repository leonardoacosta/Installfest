import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { SpecLifecycleService } from '../services/spec-lifecycle';
import {
  specStatusSchema,
  transitionRequestSchema,
  approveSpecSchema,
  rejectSpecSchema,
  markAppliedSchema,
  updateVerificationSchema,
} from '@homelab/validators';

const lifecycleService = new SpecLifecycleService();

export const lifecycleRouter = createTRPCRouter({
  /**
   * Get current status and history for a spec
   */
  getStatus: publicProcedure
    .input(z.object({ specId: z.string() }))
    .query(async ({ input }) => {
      const [currentState, history, completion] = await Promise.all([
        lifecycleService.getCurrentState(input.specId),
        lifecycleService.getStateHistory(input.specId),
        lifecycleService.getTasksCompletion(input.specId),
      ]);

      return {
        currentState,
        history,
        tasksCompletionPercentage: completion,
      };
    }),

  /**
   * Transition spec to a new state
   */
  transitionTo: publicProcedure
    .input(transitionRequestSchema)
    .mutation(async ({ input }) => {
      await lifecycleService.transitionState(
        input.specId,
        input.toState,
        input.userId ? 'user' : input.sessionId ? 'worker' : 'system',
        input.notes,
        input.userId,
        input.sessionId
      );

      return { success: true };
    }),

  /**
   * Approve a spec (proposing → approved)
   */
  approve: publicProcedure
    .input(approveSpecSchema)
    .mutation(async ({ input }) => {
      await lifecycleService.approve(input.specId, input.userId);

      return { success: true };
    }),

  /**
   * Reject a spec (any state → proposing)
   */
  reject: publicProcedure
    .input(rejectSpecSchema)
    .mutation(async ({ input }) => {
      await lifecycleService.reject(input.specId, input.reason, input.userId);

      return { success: true };
    }),

  /**
   * Mark spec as applied (review → applied)
   */
  markApplied: publicProcedure
    .input(markAppliedSchema)
    .mutation(async ({ input }) => {
      await lifecycleService.markApplied(
        input.specId,
        input.projectId,
        input.sessionId,
        input.verificationNotes,
        input.userId
      );

      return { success: true };
    }),

  /**
   * Update verification status for an applied spec
   */
  updateVerification: publicProcedure
    .input(updateVerificationSchema)
    .mutation(async ({ input }) => {
      await lifecycleService.updateVerification(
        input.specId,
        input.projectId,
        input.status,
        input.notes
      );

      return { success: true };
    }),

  /**
   * Get all applied specs for a project
   */
  getAppliedSpecs: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      return await lifecycleService.getAppliedSpecs(input.projectId);
    }),

  /**
   * Get all projects where a spec has been applied
   */
  getSpecApplications: publicProcedure
    .input(z.object({ specId: z.string() }))
    .query(async ({ input }) => {
      return await lifecycleService.getSpecApplications(input.specId);
    }),

  /**
   * Check if spec requires user approval
   */
  requiresApproval: publicProcedure
    .input(z.object({ specId: z.string() }))
    .query(async ({ input }) => {
      return {
        requiresApproval: await lifecycleService.requiresUserApproval(input.specId),
      };
    }),

  /**
   * Get possible next states for a spec
   */
  getNextStates: publicProcedure
    .input(z.object({ specId: z.string() }))
    .query(async ({ input }) => {
      const currentState = await lifecycleService.getCurrentState(input.specId);

      if (!currentState) {
        throw new Error(`Spec ${input.specId} not found`);
      }

      const rulesEngine = new (await import('../services/transition-rules')).TransitionRulesEngine();
      const nextStates = rulesEngine.getNextStates(currentState);

      return {
        currentState,
        nextStates,
      };
    }),
});
