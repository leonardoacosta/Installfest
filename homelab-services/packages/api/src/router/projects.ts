/**
 * Projects Router
 *
 * Handles CRUD operations for Claude agent projects.
 */

import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '../trpc'

export const projectsRouter = createTRPCRouter({
  // List all projects
  list: publicProcedure.query(({ ctx }) => {
    return ctx.db
      .prepare('SELECT * FROM projects ORDER BY created_at DESC')
      .all()
  }),

  // Get single project by ID
  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => {
      return ctx.db
        .prepare('SELECT * FROM projects WHERE id = ?')
        .get(input.id)
    }),

  // Create new project
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        path: z.string().min(1),
      })
    )
    .mutation(({ ctx, input }) => {
      const result = ctx.db
        .prepare('INSERT INTO projects (name, path) VALUES (?, ?)')
        .run(input.name, input.path)

      return {
        id: result.lastInsertRowid,
        name: input.name,
        path: input.path,
      }
    }),

  // Delete project
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => {
      ctx.db.prepare('DELETE FROM projects WHERE id = ?').run(input.id)
      return { success: true }
    }),
})
