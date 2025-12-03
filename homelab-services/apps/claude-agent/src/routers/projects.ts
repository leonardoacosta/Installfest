import { router, publicProcedure } from '../trpc/init';
import { projects, sessions } from '@homelab/db';
import {
  createProjectSchema,
  updateProjectSchema,
  projectIdSchema,
} from '@homelab/validators';
import { eq, desc } from 'drizzle-orm';

export const projectsRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    // Get all projects with session count
    const allProjects = await ctx.db
      .select({
        id: projects.id,
        name: projects.name,
        path: projects.path,
        description: projects.description,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .orderBy(desc(projects.updatedAt));

    // Get session counts for each project
    const projectsWithCounts = await Promise.all(
      allProjects.map(async (project) => {
        const sessionCount = await ctx.db
          .select({ count: sessions.id })
          .from(sessions)
          .where(eq(sessions.projectId, project.id));

        const lastActivity = await ctx.db
          .select({ startedAt: sessions.startedAt })
          .from(sessions)
          .where(eq(sessions.projectId, project.id))
          .orderBy(desc(sessions.startedAt))
          .limit(1);

        return {
          ...project,
          sessionCount: sessionCount.length,
          lastActivity: lastActivity[0]?.startedAt || null,
        };
      })
    );

    return projectsWithCounts;
  }),

  getById: publicProcedure
    .input(projectIdSchema)
    .query(async ({ ctx, input }) => {
      const project = await ctx.db
        .select()
        .from(projects)
        .where(eq(projects.id, input.id))
        .limit(1);

      if (!project[0]) {
        throw new Error('Project not found');
      }

      return project[0];
    }),

  create: publicProcedure
    .input(createProjectSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .insert(projects)
        .values({
          name: input.name,
          path: input.path,
          description: input.description,
        })
        .returning();

      return result[0];
    }),

  update: publicProcedure
    .input(projectIdSchema.merge(updateProjectSchema))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      const result = await ctx.db
        .update(projects)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, id))
        .returning();

      if (!result[0]) {
        throw new Error('Project not found');
      }

      return result[0];
    }),

  delete: publicProcedure
    .input(projectIdSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(projects)
        .where(eq(projects.id, input.id));

      return { success: true };
    }),
});
