import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter, createContext, config } from '@homelab/api'

const handler = async (req: Request) => {
  // CORS headers for cross-origin requests
  const allowedOrigins = config.cors.origins
  const origin = req.headers.get('origin') || '*'
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigins.includes('*') ? '*' : origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  // Log incoming request
  console.log(`[tRPC] ${req.method} ${req.url}`)

  try {
    const response = await fetchRequestHandler({
      endpoint: '/api/trpc',
      req,
      router: appRouter,
      createContext,
      onError({ error, type, path }) {
        console.error(`[tRPC Error] ${type} at ${path}:`, error)
      },
    })

    // Add CORS headers to response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  } catch (error) {
    console.error('[tRPC] Unhandled error:', error)
    throw error
  }
}

export { handler as GET, handler as POST, handler as OPTIONS }
