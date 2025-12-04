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
import { failuresRouter } from './router/failures'
import { remediationRouter } from './router/remediation'
import { configRouter } from './router/config'
import { testFailuresRouter } from './router/testFailures'

export const appRouter = createTRPCRouter({
  projects: projectsRouter,
  sessions: sessionsRouter,
  hooks: hooksRouter,
  reports: reportsRouter,
  failures: failuresRouter,
  remediation: remediationRouter,
  config: configRouter,
  testFailures: testFailuresRouter,
})

export type AppRouter = typeof appRouter
