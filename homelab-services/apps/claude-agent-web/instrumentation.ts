/**
 * Next.js Instrumentation Hook
 *
 * This file is called once when the server starts up.
 * Used to initialize the failure watcher service.
 */

import { db } from './db';
import { FailureWatcherService } from '@homelab/api/src/services/failure-watcher';
import path from 'path';

let failureWatcher: FailureWatcherService | null = null;

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[Instrumentation] Initializing failure watcher service...');

    // Get project configuration from environment
    const projectId = parseInt(process.env.PROJECT_ID ?? '1', 10);
    const projectPath = process.env.PROJECT_PATH ?? path.resolve(process.cwd(), '../..');
    const openspecPath = path.join(projectPath, 'openspec');

    // Initialize failure watcher
    failureWatcher = new FailureWatcherService(db, {
      projectId,
      projectPath,
      openspecPath,
    });

    // Start watching for new failures
    failureWatcher.start();

    console.log('[Instrumentation] Failure watcher service started successfully');
    console.log(`[Instrumentation] Monitoring project ${projectId} at ${projectPath}`);
  }
}

// Cleanup on shutdown
process.on('SIGTERM', () => {
  console.log('[Instrumentation] SIGTERM received, stopping failure watcher...');
  if (failureWatcher) {
    failureWatcher.stop();
  }
});

process.on('SIGINT', () => {
  console.log('[Instrumentation] SIGINT received, stopping failure watcher...');
  if (failureWatcher) {
    failureWatcher.stop();
  }
});
