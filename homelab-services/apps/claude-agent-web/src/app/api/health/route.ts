import { NextResponse } from 'next/server'
import { getDb } from '@homelab/db'

export async function GET() {
  try {
    // Check database connectivity
    const db = getDb()
    const result = db.prepare('SELECT 1 as health').get() as { health: number } | undefined

    if (!result || result.health !== 1) {
      throw new Error('Database health check failed')
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      service: 'claude-agent-web',
    })
  } catch (error) {
    console.error('[Health Check] Failed:', error)
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        service: 'claude-agent-web',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}
