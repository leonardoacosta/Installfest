/**
 * Next.js Instrumentation
 *
 * Runs once when the server starts.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only run on server-side
    const { startWatcher } = await import('./src/services/init-watcher');

    try {
      console.log('[Instrumentation] Starting report watcher...');
      startWatcher();
      console.log('[Instrumentation] Report watcher started successfully');
    } catch (error) {
      console.error('[Instrumentation] Failed to start report watcher:', error);
    }
  }
}
