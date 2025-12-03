import { router, publicProcedure } from '../trpc/init';
import { sessions, projects } from '@homelab/db';
import {
  createSessionSchema,
  sessionIdSchema,
  sessionFilterSchema,
} from '@homelab/validators';
import { eq, desc, and } from 'drizzle-orm';

export const sessionsRouter = router({
  list: publicProcedure
    .input(sessionFilterSchema)
    .query(async ({ ctx, input }) => {
      const conditions = [];

      if (input.projectId) {
        conditions.push(eq(sessions.projectId, input.projectId));
      }

      if (input.status) {
        conditions.push(eq(sessions.status, input.status));
      }

      const result = await ctx.db
        .select({
          id: sessions.id,
          projectId: sessions.projectId,
          agentId: sessions.agentId,
          status: sessions.status,
          startedAt: sessions.startedAt,
          stoppedAt: sessions.stoppedAt,
          errorMessage: sessions.errorMessage,
          projectName: projects.name,
          projectPath: projects.path,
        })
        .from(sessions)
        .leftJoin(projects, eq(sessions.projectId, projects.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(sessions.startedAt));

      return result;
    }),

  getById: publicProcedure
    .input(sessionIdSchema)
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(sessions)
        .where(eq(sessions.id, input.id))
        .limit(1);

      if (!result[0]) {
        throw new Error('Session not found');
      }

      return result[0];
    }),

  create: publicProcedure
    .input(createSessionSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify project exists
      const project = await ctx.db
        .select()
        .from(projects)
        .where(eq(projects.id, input.projectId))
        .limit(1);

      if (!project[0]) {
        throw new Error('Project not found');
      }

      // Generate agent ID
      const agentId = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create session
      const result = await ctx.db
        .insert(sessions)
        .values({
          projectId: input.projectId,
          agentId,
          status: 'running',
        })
        .returning();

      return result[0];
    }),

  stop: publicProcedure
    .input(sessionIdSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .update(sessions)
        .set({
          status: 'stopped',
          stoppedAt: new Date(),
        })
        .where(eq(sessions.id, input.id))
        .returning();

      if (!result[0]) {
        throw new Error('Session not found');
      }

      return result[0];
    }),
});
