/**
 * Root tRPC Router
 *
 * Combines all routers into a single app router.
 */

import { createTRPCRouter } from './trpc'
import { projectsRouter } from './router/projects'
import { sessionsRouter } from './router/sessions'
import { hooksRouter } from './router/hooks'
import { reportsRouter } from './router/reports'

export const appRouter = createTRPCRouter({
  projects: projectsRouter,
  sessions: sessionsRouter,
  hooks: hooksRouter,
  reports: reportsRouter,
})

export type AppRouter = typeof appRouter
