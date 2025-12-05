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

  /**
   * Get lifecycle statistics by project
   */
  stats: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => {
      const specs = await ctx.db.query.openspecSpecs.findMany({
        where: (specs, { eq }) => eq(specs.projectId, input.projectId),
      });

      const statusCounts = specs.reduce((acc: any, spec: any) => {
        const status = spec.status || 'proposing';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      return {
        total: specs.length,
        proposing: statusCounts.proposing || 0,
        approved: statusCounts.approved || 0,
        assigned: statusCounts.assigned || 0,
        in_progress: statusCounts.in_progress || 0,
        review: statusCounts.review || 0,
        applied: statusCounts.applied || 0,
        archived: statusCounts.archived || 0,
      };
    }),

  /**
   * List specs by status
   */
  listByStatus: publicProcedure
    .input(z.object({
      projectId: z.number(),
      status: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const specs = await ctx.db.query.openspecSpecs.findMany({
        where: (specs, { eq, and }) => and(
          eq(specs.projectId, input.projectId),
          eq(specs.status, input.status)
        ),
      });

      return specs;
    }),
});
