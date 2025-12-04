/**
 * Health Check Endpoint
 */

import { NextResponse } from 'next/server';
import { getWatcher } from '../../../services/init-watcher';

export async function GET() {
  const watcher = getWatcher();

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    watcher: {
      running: !!watcher,
    },
  });
}
