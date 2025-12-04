/**
 * Projects Router
 *
 * Handles CRUD operations for Claude agent projects.
 */

import { eq, desc } from 'drizzle-orm'
import { createTRPCRouter, publicProcedure } from '../trpc'
import { projects } from '@homelab/db'
import {
  createProjectSchema,
  updateProjectSchema,
  projectIdSchema
} from '@homelab/validators'

export const projectsRouter = createTRPCRouter({
  // List all projects
  list: publicProcedure.query(({ ctx }) => {
    return ctx.db.select().from(projects).orderBy(desc(projects.createdAt))
  }),

  // Get single project by ID
  byId: publicProcedure
    .input(projectIdSchema)
    .query(({ ctx, input }) => {
      return ctx.db
        .select()
        .from(projects)
        .where(eq(projects.id, input.id))
        .get()
    }),

  // Create new project
  create: publicProcedure
    .input(createProjectSchema)
    .mutation(async ({ ctx, input }) => {
      const [project] = await ctx.db
        .insert(projects)
        .values({
          name: input.name,
          path: input.path,
          description: input.description,
        })
        .returning()

      return project
    }),

  // Update project
  update: publicProcedure
    .input(projectIdSchema.merge(updateProjectSchema))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input
      const [project] = await ctx.db
        .update(projects)
        .set(updates)
        .where(eq(projects.id, id))
        .returning()

      return project
    }),

  // Delete project
  delete: publicProcedure
    .input(projectIdSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(projects).where(eq(projects.id, input.id))
      return { success: true }
    }),
})
