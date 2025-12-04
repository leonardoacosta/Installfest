/**
 * Initialize Report Watcher
 *
 * Sets up and starts the file watcher service.
 */

import { ReportWatcher, type WatcherConfig } from './watcher';

const REPORTS_DIR = process.env.REPORTS_DIR || '/reports';
const DB_PATH = process.env.DB_PATH || '/app/db/reports.db';
const CLAUDE_SERVER_URL = process.env.CLAUDE_SERVER_URL || 'http://claude-agent-server:3002';
const CLAUDE_ENABLED = process.env.CLAUDE_INTEGRATION_ENABLED !== 'false';

const config: WatcherConfig = {
  reportsDir: REPORTS_DIR,
  dbPath: DB_PATH,
  claudeConfig: {
    serverUrl: CLAUDE_SERVER_URL,
    enabled: CLAUDE_ENABLED,
    rateLimit: {
      perWorkflow: parseInt(process.env.RATE_LIMIT_PER_WORKFLOW || '1', 10),
      global: parseInt(process.env.RATE_LIMIT_GLOBAL || '5', 10),
    },
    retryAttempts: 3,
    retryDelayMs: 1000,
  },
};

// Singleton instance
let watcherInstance: ReportWatcher | null = null;

export function startWatcher(): ReportWatcher {
  if (watcherInstance) {
    console.log('Watcher already running');
    return watcherInstance;
  }

  console.log('Initializing report watcher with config:', {
    reportsDir: config.reportsDir,
    dbPath: config.dbPath,
    claudeServerUrl: config.claudeConfig.serverUrl,
    claudeEnabled: config.claudeConfig.enabled,
  });

  watcherInstance = new ReportWatcher(config);
  watcherInstance.start();

  return watcherInstance;
}

export function getWatcher(): ReportWatcher | null {
  return watcherInstance;
}

export async function stopWatcher(): Promise<void> {
  if (watcherInstance) {
    await watcherInstance.stop();
    watcherInstance = null;
  }
}

// Handle process termination
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, stopping watcher...');
  await stopWatcher();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, stopping watcher...');
  await stopWatcher();
  process.exit(0);
});
