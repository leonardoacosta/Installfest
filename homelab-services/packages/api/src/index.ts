/**
 * @homelab/api
 *
 * Shared tRPC API for homelab services.
 */

export { appRouter, type AppRouter } from './root'
export { createContext, type Context } from './context'
export { createTRPCRouter, publicProcedure } from './trpc'
export { config, type Config } from './config'
export { hookEvents, type HookEvent } from './events'
