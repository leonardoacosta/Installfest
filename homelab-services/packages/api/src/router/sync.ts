/**
 * Sync Router
 *
 * Handles OpenSpec bidirectional sync operations between filesystem and database.
 */

import { eq } from 'drizzle-orm';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { openspecSpecs, projects } from '@homelab/db';
import {
  syncSpecInputSchema,
  forceSyncInputSchema,
  resolveConflictInputSchema,
  getSyncHistoryInputSchema,
  stringIdParamSchema,
} from '@homelab/validators';
import { OpenSpecSyncService } from '../services/openspec-sync';

export const syncRouter = createTRPCRouter({
  /**
   * Get sync status for a spec
   */
  getStatus: publicProcedure
    .input(stringIdParamSchema)
    .query(async ({ ctx, input }) => {
      // Get spec from DB to find project
      const spec = await ctx.db
        .select()
        .from(openspecSpecs)
        .where(eq(openspecSpecs.id, input.id))
        .get();

      if (!spec) {
        throw new Error(`Spec ${input.id} not found`);
      }

      // Get project to build sync service
      const project = await ctx.db
        .select()
        .from(projects)
        .where(eq(projects.id, spec.projectId))
        .get();

      if (!project) {
        throw new Error(`Project ${spec.projectId} not found`);
      }

      // Create sync service
      const syncService = new OpenSpecSyncService(ctx.db, {
        projectId: project.id,
        projectPath: project.path,
        openspecPath: `${project.path}/openspec`,
      });

      // Get status
      return syncService.getLastSyncStatus(input.id);
    }),

  /**
   * Force immediate sync for a spec
   */
  forceSync: publicProcedure
    .input(forceSyncInputSchema)
    .mutation(async ({ ctx, input }) => {
      // If specId provided, sync single spec
      if (input.specId) {
        const spec = await ctx.db
          .select()
          .from(openspecSpecs)
          .where(eq(openspecSpecs.id, input.specId))
          .get();

        if (!spec) {
          throw new Error(`Spec ${input.specId} not found`);
        }

        const project = await ctx.db
          .select()
          .from(projects)
          .where(eq(projects.id, spec.projectId))
          .get();

        if (!project) {
          throw new Error(`Project ${spec.projectId} not found`);
        }

        const syncService = new OpenSpecSyncService(ctx.db, {
          projectId: project.id,
          projectPath: project.path,
          openspecPath: `${project.path}/openspec`,
        });

        await syncService.syncFromFilesystem(input.specId, true);

        return {
          success: true,
          specsSynced: 1,
          specIds: [input.specId],
        };
      }

      // If projectId provided, sync all specs for project
      if (input.projectId) {
        const project = await ctx.db
          .select()
          .from(projects)
          .where(eq(projects.id, input.projectId))
          .get();

        if (!project) {
          throw new Error(`Project ${input.projectId} not found`);
        }

        const syncService = new OpenSpecSyncService(ctx.db, {
          projectId: project.id,
          projectPath: project.path,
          openspecPath: `${project.path}/openspec`,
        });

        const staleSpecs = await syncService.getStaleSpecs();
        await syncService.syncBatch(staleSpecs);

        return {
          success: true,
          specsSynced: staleSpecs.length,
          specIds: staleSpecs,
        };
      }

      throw new Error('Either specId or projectId must be provided');
    }),

  /**
   * Resolve conflict by forcing filesystem or DB to win
   */
  resolveConflict: publicProcedure
    .input(resolveConflictInputSchema)
    .mutation(async ({ ctx, input }) => {
      const spec = await ctx.db
        .select()
        .from(openspecSpecs)
        .where(eq(openspecSpecs.id, input.specId))
        .get();

      if (!spec) {
        throw new Error(`Spec ${input.specId} not found`);
      }

      const project = await ctx.db
        .select()
        .from(projects)
        .where(eq(projects.id, spec.projectId))
        .get();

      if (!project) {
        throw new Error(`Project ${spec.projectId} not found`);
      }

      const syncService = new OpenSpecSyncService(ctx.db, {
        projectId: project.id,
        projectPath: project.path,
        openspecPath: `${project.path}/openspec`,
      });

      if (input.resolution === 'filesystem_wins') {
        await syncService.forceFilesystemWins(input.specId);
      } else {
        await syncService.forceDbWins(input.specId);
      }

      return {
        success: true,
        resolution: input.resolution,
        specId: input.specId,
      };
    }),

  /**
   * Get sync history for a spec
   */
  getSyncHistory: publicProcedure
    .input(getSyncHistoryInputSchema)
    .query(async ({ ctx, input }) => {
      const spec = await ctx.db
        .select()
        .from(openspecSpecs)
        .where(eq(openspecSpecs.id, input.specId))
        .get();

      if (!spec) {
        throw new Error(`Spec ${input.specId} not found`);
      }

      const project = await ctx.db
        .select()
        .from(projects)
        .where(eq(projects.id, spec.projectId))
        .get();

      if (!project) {
        throw new Error(`Project ${spec.projectId} not found`);
      }

      const syncService = new OpenSpecSyncService(ctx.db, {
        projectId: project.id,
        projectPath: project.path,
        openspecPath: `${project.path}/openspec`,
      });

      return syncService.getSyncHistory(input.specId, input.limit);
    }),

  /**
   * List all specs with sync status
   */
  listSpecs: publicProcedure.query(async ({ ctx }) => {
    const specs = await ctx.db
      .select({
        id: openspecSpecs.id,
        projectId: openspecSpecs.projectId,
        title: openspecSpecs.title,
        status: openspecSpecs.status,
        lastSyncedAt: openspecSpecs.lastSyncedAt,
        syncError: openspecSpecs.syncError,
      })
      .from(openspecSpecs)
      .all();

    return specs;
  }),

  /**
   * Get spec details including content
   */
  getSpec: publicProcedure
    .input(stringIdParamSchema)
    .query(async ({ ctx, input }) => {
      const spec = await ctx.db
        .select()
        .from(openspecSpecs)
        .where(eq(openspecSpecs.id, input.id))
        .get();

      if (!spec) {
        throw new Error(`Spec ${input.id} not found`);
      }

      return spec;
    }),
});
