import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '@homelab/api'

export const trpc = createTRPCReact<AppRouter>()
