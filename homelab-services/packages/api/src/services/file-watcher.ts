import chokidar, { FSWatcher } from 'chokidar';
import * as path from 'path';
import { EventEmitter } from 'events';
import type { OpenSpecSyncService } from './openspec-sync';

/**
 * File watcher events
 */
export interface FileWatcherEvents {
  file_changed: (specId: string, filePath: string) => void;
  file_added: (specId: string, filePath: string) => void;
  file_deleted: (specId: string, filePath: string) => void;
  error: (error: Error) => void;
}

/**
 * Configuration for file watcher
 */
export interface FileWatcherConfig {
  projectId: number;
  openspecPath: string;
  debounceMs?: number;
}

/**
 * File watcher service for OpenSpec directory
 * Watches proposal.md, tasks.md, design.md in changes/*/ directories
 */
export class FileWatcherService extends EventEmitter {
  private watcher: FSWatcher | null = null;
  private syncService: OpenSpecSyncService | null = null;
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private config: FileWatcherConfig;

  constructor(config: FileWatcherConfig) {
    super();
    this.config = {
      debounceMs: 100, // Default 100ms debounce
      ...config,
    };
  }

  /**
   * Start watching the OpenSpec directory
   */
  start(syncService: OpenSpecSyncService): void {
    this.syncService = syncService;

    const changesDir = path.join(this.config.openspecPath, 'changes');

    // Watch patterns for OpenSpec files
    const watchPatterns = [
      path.join(changesDir, '*', 'proposal.md'),
      path.join(changesDir, '*', 'tasks.md'),
      path.join(changesDir, '*', 'design.md'),
    ];

    console.log(`[FileWatcher] Starting watcher for: ${changesDir}`);

    this.watcher = chokidar.watch(watchPatterns, {
      persistent: true,
      ignoreInitial: true, // Don't emit events for initial scan
      awaitWriteFinish: {
        stabilityThreshold: 200,
        pollInterval: 100,
      },
    });

    this.watcher.on('change', (filePath) => this.handleChange(filePath));
    this.watcher.on('add', (filePath) => this.handleAdd(filePath));
    this.watcher.on('unlink', (filePath) => this.handleDelete(filePath));
    this.watcher.on('error', (error) => this.handleError(error));

    this.watcher.on('ready', () => {
      console.log('[FileWatcher] Ready and watching for changes');
    });
  }

  /**
   * Stop watching
   */
  async stop(): Promise<void> {
    if (this.watcher) {
      console.log('[FileWatcher] Stopping watcher');
      await this.watcher.close();
      this.watcher = null;
    }

    // Clear all pending debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
  }

  /**
   * Handle file change event
   */
  private handleChange(filePath: string): void {
    const specId = this.extractSpecId(filePath);
    if (!specId) return;

    console.log(`[FileWatcher] File changed: ${filePath} (spec: ${specId})`);

    this.debounceSync(specId, () => {
      this.emit('file_changed', specId, filePath);
      this.triggerSync(specId, filePath);
    });
  }

  /**
   * Handle file add event
   */
  private handleAdd(filePath: string): void {
    const specId = this.extractSpecId(filePath);
    if (!specId) return;

    console.log(`[FileWatcher] File added: ${filePath} (spec: ${specId})`);

    this.debounceSync(specId, () => {
      this.emit('file_added', specId, filePath);
      this.triggerSync(specId, filePath);
    });
  }

  /**
   * Handle file delete event
   */
  private handleDelete(filePath: string): void {
    const specId = this.extractSpecId(filePath);
    if (!specId) return;

    console.log(`[FileWatcher] File deleted: ${filePath} (spec: ${specId})`);

    this.emit('file_deleted', specId, filePath);
    // Don't trigger sync on delete - let periodic sync handle it
  }

  /**
   * Handle watcher errors
   */
  private handleError(error: Error): void {
    console.error('[FileWatcher] Error:', error);
    this.emit('error', error);
  }

  /**
   * Extract spec ID from file path
   * Example: /path/to/openspec/changes/1-add-feature/proposal.md -> "1-add-feature"
   */
  private extractSpecId(filePath: string): string | null {
    const match = filePath.match(/changes[/\\]([^/\\]+)[/\\](proposal|tasks|design)\.md$/);
    return match ? match[1] : null;
  }

  /**
   * Debounce sync operations to avoid rapid successive syncs
   */
  private debounceSync(specId: string, callback: () => void): void {
    // Clear existing timer for this spec
    const existingTimer = this.debounceTimers.get(specId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      callback();
      this.debounceTimers.delete(specId);
    }, this.config.debounceMs);

    this.debounceTimers.set(specId, timer);
  }

  /**
   * Trigger immediate sync for a spec
   */
  private async triggerSync(specId: string, filePath: string): Promise<void> {
    if (!this.syncService) {
      console.error('[FileWatcher] Sync service not initialized');
      return;
    }

    try {
      console.log(`[FileWatcher] Triggering immediate sync for spec: ${specId}`);
      await this.syncService.syncFromFilesystem(specId, true);
      console.log(`[FileWatcher] Sync completed for spec: ${specId}`);
    } catch (error) {
      console.error(`[FileWatcher] Sync failed for spec ${specId}:`, error);
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Check if watcher is active
   */
  isWatching(): boolean {
    return this.watcher !== null;
  }
}
