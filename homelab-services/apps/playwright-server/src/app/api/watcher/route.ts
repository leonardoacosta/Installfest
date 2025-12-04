/**
 * Watcher API Routes
 *
 * Provides endpoints to control and monitor the file watcher.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWatcher, startWatcher, stopWatcher } from '../../../services/init-watcher';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'status') {
    const watcher = getWatcher();

    if (!watcher) {
      return NextResponse.json({ running: false });
    }

    const stats = watcher.getStats();
    return NextResponse.json({
      running: true,
      stats,
    });
  }

  if (action === 'start') {
    try {
      const watcher = startWatcher();
      return NextResponse.json({ success: true, message: 'Watcher started' });
    } catch (error) {
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  }

  if (action === 'stop') {
    try {
      await stopWatcher();
      return NextResponse.json({ success: true, message: 'Watcher stopped' });
    } catch (error) {
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
