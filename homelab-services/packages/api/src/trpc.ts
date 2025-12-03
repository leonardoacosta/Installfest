/**
 * tRPC Base Configuration
 *
 * Defines the base tRPC instance with context and transformers.
 */

import { initTRPC } from '@trpc/server'
import superjson from 'superjson'
import type { Context } from './context'

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape
  },
})

/**
 * Export reusable router and procedure helpers
 */
export const createTRPCRouter = t.router
export const publicProcedure = t.procedure
