/**
 * tRPC Context
 *
 * Creates the context for tRPC procedures.
 * Context is created on each request and is available to all procedures.
 */

import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import { getDb } from '@homelab/db'

export interface CreateContextOptions {
  headers: Headers
}

/**
 * Inner context - doesn't depend on the request
 */
export const createContextInner = (opts: CreateContextOptions) => {
  return {
    headers: opts.headers,
    db: getDb(),
  }
}

/**
 * Outer context - used for tRPC
 */
export const createContext = (opts: FetchCreateContextFnOptions) => {
  return createContextInner({
    headers: opts.req.headers,
  })
}

export type Context = Awaited<ReturnType<typeof createContext>>
