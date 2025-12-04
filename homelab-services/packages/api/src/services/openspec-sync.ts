import { eq, and, lt } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { openspecSpecs, syncHistory } from '@homelab/db';
import type { SyncConflict } from '@homelab/validators';
import {
  readOpenSpecFiles,
  writeOpenSpecFiles,
  getFileMtime,
  fileExists,
} from '../utils/filesystem';
import { parseProposalMd } from '../utils/markdown';

/**
 * Configuration for OpenSpecSyncService
 */
export interface OpenSpecSyncConfig {
  projectId: number;
  projectPath: string;
  openspecPath: string;
}

/**
 * Core bidirectional sync service between filesystem and database
 */
export class OpenSpecSyncService {
  constructor(
    private db: LibSQLDatabase<any>,
    private config: OpenSpecSyncConfig
  ) {}

  /**
   * Sync from filesystem to database
   * Reads OpenSpec files and updates DB with content
   */
  async syncFromFilesystem(
    specId: string,
    immediate = false
  ): Promise<void> {
    try {
      // Read all spec files
      const {
        proposalContent,
        tasksContent,
        designContent,
        proposalPath,
      } = await readOpenSpecFiles(this.config.openspecPath, specId);

      // Get filesystem modification time
      const filesystemMtime = getFileMtime(proposalPath);

      // Parse proposal to extract title
      let title = specId;
      try {
        const proposal = parseProposalMd(proposalContent || '');
        title = proposal.title;
      } catch (error) {
        console.warn(`Failed to parse proposal for spec ${specId}:`, error);
      }

      // Execute in transaction
      await this.db.batch([
        // Upsert spec
        this.db
          .insert(openspecSpecs)
          .values({
            id: specId,
            projectId: this.config.projectId,
            title,
            proposalContent,
            tasksContent,
            designContent,
            filesystemModifiedAt: filesystemMtime,
            lastSyncedAt: new Date(),
            syncError: null, // Clear any previous errors
          })
          .onConflictDoUpdate({
            target: openspecSpecs.id,
            set: {
              title,
              proposalContent,
              tasksContent,
              designContent,
              filesystemModifiedAt: filesystemMtime,
              lastSyncedAt: new Date(),
              syncError: null,
              updatedAt: new Date(),
            },
          }),

        // Log sync history
        this.db.insert(syncHistory).values({
          specId,
          syncDirection: 'fs_to_db',
          triggeredBy: immediate ? 'file_watcher' : 'periodic',
          success: true,
          filesChanged: [proposalPath],
          syncedAt: new Date(),
        }),
      ]);
    } catch (error) {
      // Log failure to sync history
      await this.db.insert(syncHistory).values({
        specId,
        syncDirection: 'fs_to_db',
        triggeredBy: immediate ? 'file_watcher' : 'periodic',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        syncedAt: new Date(),
      });

      // Update spec with error
      await this.db
        .update(openspecSpecs)
        .set({
          syncError: error instanceof Error ? error.message : 'Unknown error',
          updatedAt: new Date(),
        })
        .where(eq(openspecSpecs.id, specId));

      throw error;
    }
  }

  /**
   * Sync from database to filesystem
   * Writes DB content to OpenSpec files
   */
  async syncToFilesystem(specId: string): Promise<void> {
    try {
      // Get spec from DB
      const spec = await this.db
        .select()
        .from(openspecSpecs)
        .where(eq(openspecSpecs.id, specId))
        .get();

      if (!spec) {
        throw new Error(`Spec ${specId} not found in database`);
      }

      // Check for conflicts before writing
      const conflict = await this.detectConflicts(specId);
      if (conflict) {
        throw new Error(
          `Spec ${specId} has conflicts. Resolve before syncing to filesystem.`
        );
      }

      // Write files
      const filesChanged = await writeOpenSpecFiles(
        this.config.openspecPath,
        specId,
        {
          proposalContent: spec.proposalContent || undefined,
          tasksContent: spec.tasksContent || undefined,
          designContent: spec.designContent || undefined,
        }
      );

      // Execute in transaction
      await this.db.batch([
        // Update spec timestamps
        this.db
          .update(openspecSpecs)
          .set({
            lastSyncedAt: new Date(),
            dbModifiedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(openspecSpecs.id, specId)),

        // Log sync history
        this.db.insert(syncHistory).values({
          specId,
          syncDirection: 'db_to_fs',
          triggeredBy: 'user_edit',
          success: true,
          filesChanged,
          syncedAt: new Date(),
        }),
      ]);
    } catch (error) {
      // Log failure to sync history
      await this.db.insert(syncHistory).values({
        specId,
        syncDirection: 'db_to_fs',
        triggeredBy: 'user_edit',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        syncedAt: new Date(),
      });

      throw error;
    }
  }

  /**
   * Detect conflicts (both filesystem and DB modified since last sync)
   */
  async detectConflicts(specId: string): Promise<SyncConflict | null> {
    const spec = await this.db
      .select()
      .from(openspecSpecs)
      .where(eq(openspecSpecs.id, specId))
      .get();

    if (!spec || !spec.lastSyncedAt) {
      return null;
    }

    // Get current filesystem mtime
    const proposalPath = `${this.config.openspecPath}/changes/${specId}/proposal.md`;
    if (!fileExists(proposalPath)) {
      return {
        specId,
        filesystemModifiedAt: new Date(0),
        dbModifiedAt: spec.dbModifiedAt || spec.updatedAt,
        lastSyncedAt: spec.lastSyncedAt,
        conflictType: 'filesystem_deleted',
      };
    }

    const filesystemMtime = getFileMtime(proposalPath);

    // Check if both modified since last sync
    const filesystemChanged = filesystemMtime > spec.lastSyncedAt;
    const dbChanged = spec.dbModifiedAt && spec.dbModifiedAt > spec.lastSyncedAt;

    if (filesystemChanged && dbChanged) {
      return {
        specId,
        filesystemModifiedAt: filesystemMtime,
        dbModifiedAt: spec.dbModifiedAt,
        lastSyncedAt: spec.lastSyncedAt,
        conflictType: 'both_modified',
      };
    }

    return null;
  }

  /**
   * Force filesystem version to win (resolve conflict)
   */
  async forceFilesystemWins(specId: string): Promise<void> {
    await this.syncFromFilesystem(specId, true);
  }

  /**
   * Force database version to win (resolve conflict)
   */
  async forceDbWins(specId: string): Promise<void> {
    await this.syncToFilesystem(specId);
  }

  /**
   * Get last sync status for a spec
   */
  async getLastSyncStatus(specId: string) {
    const spec = await this.db
      .select()
      .from(openspecSpecs)
      .where(eq(openspecSpecs.id, specId))
      .get();

    if (!spec) {
      return null;
    }

    const conflict = await this.detectConflicts(specId);
    const staleThreshold = new Date(Date.now() - 30000); // 30 seconds ago
    const isStale = !spec.lastSyncedAt || spec.lastSyncedAt < staleThreshold;

    return {
      specId,
      lastSyncedAt: spec.lastSyncedAt,
      syncError: spec.syncError,
      filesystemModifiedAt: spec.filesystemModifiedAt,
      dbModifiedAt: spec.dbModifiedAt,
      hasConflict: conflict !== null,
      isStale,
    };
  }

  /**
   * Get sync history for a spec
   */
  async getSyncHistory(specId: string, limit = 20) {
    const history = await this.db
      .select()
      .from(syncHistory)
      .where(eq(syncHistory.specId, specId))
      .orderBy(eq(syncHistory.syncedAt, 'DESC'))
      .limit(limit)
      .all();

    return history.map((record) => ({
      ...record,
      filesChanged: record.filesChanged
        ? JSON.parse(record.filesChanged)
        : null,
    }));
  }

  /**
   * Batch sync multiple specs
   */
  async syncBatch(specIds: string[]): Promise<void> {
    const CONCURRENCY_LIMIT = 10;
    const errors: Array<{ specId: string; error: Error }> = [];

    // Process in batches to limit concurrency
    for (let i = 0; i < specIds.length; i += CONCURRENCY_LIMIT) {
      const batch = specIds.slice(i, i + CONCURRENCY_LIMIT);
      const results = await Promise.allSettled(
        batch.map((specId) => this.syncFromFilesystem(specId, false))
      );

      // Collect errors
      results.forEach((result, idx) => {
        if (result.status === 'rejected') {
          errors.push({
            specId: batch[idx],
            error: result.reason,
          });
        }
      });
    }

    if (errors.length > 0) {
      console.error(
        `Batch sync completed with ${errors.length} errors:`,
        errors
      );
    }
  }

  /**
   * Get all stale specs (not synced in last 30 seconds)
   */
  async getStaleSpecs(): Promise<string[]> {
    const staleThreshold = new Date(Date.now() - 30000);

    const specs = await this.db
      .select({ id: openspecSpecs.id })
      .from(openspecSpecs)
      .where(
        and(
          eq(openspecSpecs.projectId, this.config.projectId),
          lt(openspecSpecs.lastSyncedAt, staleThreshold)
        )
      )
      .all();

    return specs.map((s) => s.id);
  }
}
