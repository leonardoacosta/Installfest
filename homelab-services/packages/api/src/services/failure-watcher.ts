import { eq, isNull, desc, sql } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { testFailures, errorProposals, openspecSpecs } from '@homelab/db';
import { ErrorProposalGenerator } from './error-proposal-generator';
import { OpenSpecSyncService, type OpenSpecSyncConfig } from './openspec-sync';
import { WorkQueueService } from './work-queue';
import { errorProposalEvents } from '../events';
import type { ErrorProposalEvent } from '@homelab/validators';
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * Failure Watcher Service
 *
 * Monitors new test failures and automatically generates error proposals
 */
export class FailureWatcherService {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly pollInterval = 30000; // 30 seconds

  constructor(
    private db: LibSQLDatabase<any>,
    private config: OpenSpecSyncConfig
  ) {}

  /**
   * Start watching for new failures
   */
  start(): void {
    if (this.isRunning) {
      console.warn('Failure watcher is already running');
      return;
    }

    console.log(`Starting failure watcher for project ${this.config.projectId}`);
    this.isRunning = true;

    // Process immediately on start
    this.processPendingFailures().catch(error => {
      console.error('Error in initial failure processing:', error);
    });

    // Then poll periodically
    this.intervalId = setInterval(() => {
      this.processPendingFailures().catch(error => {
        console.error('Error in periodic failure processing:', error);
      });
    }, this.pollInterval);
  }

  /**
   * Stop watching for failures
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    console.log('Stopping failure watcher');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Emit event to event emitter
   */
  private emit(event: ErrorProposalEvent): void {
    errorProposalEvents.emit('error-proposal:event', event);
  }

  /**
   * Process all pending test failures
   */
  async processPendingFailures(): Promise<void> {
    try {
      // Find test failures without error proposals
      const pendingFailures = await this.db
        .select({
          id: testFailures.id,
          testName: testFailures.testName,
          error: testFailures.error,
          createdAt: testFailures.createdAt,
        })
        .from(testFailures)
        .leftJoin(errorProposals, eq(testFailures.id, errorProposals.testFailureId))
        .where(isNull(errorProposals.id))
        .orderBy(desc(testFailures.createdAt))
        .limit(10); // Process max 10 at a time

      if (pendingFailures.length === 0) {
        return; // No pending failures
      }

      console.log(`Processing ${pendingFailures.length} pending failure(s)`);

      for (const failure of pendingFailures) {
        try {
          await this.handleNewFailure(failure.id);
        } catch (error) {
          console.error(`Error processing failure ${failure.id}:`, error);
          // Continue processing other failures
        }
      }

      console.log(`Completed processing ${pendingFailures.length} failure(s)`);
    } catch (error) {
      console.error('Error in processPendingFailures:', error);
    }
  }

  /**
   * Handle a single new test failure
   */
  private async handleNewFailure(testFailureId: number): Promise<void> {
    // Fetch test failure
    const failure = await this.db
      .select()
      .from(testFailures)
      .where(eq(testFailures.id, testFailureId))
      .get();

    if (!failure) {
      console.error(`Test failure ${testFailureId} not found`);
      return;
    }

    console.log(`Handling new failure: ${failure.testName}`);

    // Check for existing error proposal for the same test name
    const existingProposal = await this.db
      .select()
      .from(errorProposals)
      .innerJoin(testFailures, eq(errorProposals.testFailureId, testFailures.id))
      .where(eq(testFailures.testName, failure.testName))
      .orderBy(desc(errorProposals.generatedAt))
      .limit(1)
      .get();

    if (existingProposal) {
      // Check if it's the same error or a different one
      const isSameError = this.isSameError(
        failure.error ?? '',
        existingProposal.test_failures.error ?? ''
      );

      if (isSameError) {
        // Update existing proposal
        await this.updateExistingProposal(existingProposal.error_proposals.id, testFailureId);
        return;
      }
    }

    // Generate new proposal
    await this.generateNewProposal(testFailureId);
  }

  /**
   * Check if two error messages represent the same error
   */
  private isSameError(error1: string, error2: string): boolean {
    // Normalize errors (remove line numbers, timestamps, etc.)
    const normalize = (err: string) =>
      err
        .toLowerCase()
        .replace(/:\d+:\d+/g, '') // Remove line:col
        .replace(/\d+/g, '') // Remove all numbers
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

    return normalize(error1) === normalize(error2);
  }

  /**
   * Update existing error proposal with new occurrence
   */
  private async updateExistingProposal(
    errorProposalId: number,
    newTestFailureId: number
  ): Promise<void> {
    const updated = await this.db
      .update(errorProposals)
      .set({
        lastFailureAt: new Date(),
        occurrenceCount: sql`${errorProposals.occurrenceCount} + 1`,
      })
      .where(eq(errorProposals.id, errorProposalId))
      .returning()
      .get();

    console.log(`Updated error proposal ${errorProposalId} (occurrence count: ${updated.occurrenceCount})`);

    // Emit update event
    this.emit({
      type: 'proposal_updated',
      errorProposalId,
      occurrenceCount: updated.occurrenceCount,
      lastFailureAt: updated.lastFailureAt,
    });

    // Check if priority should escalate
    await this.checkPriorityEscalation(errorProposalId, updated.occurrenceCount);
  }

  /**
   * Generate new error proposal
   */
  private async generateNewProposal(testFailureId: number): Promise<void> {
    const generator = new ErrorProposalGenerator(this.db);

    // Get next change number
    const changeNumber = await this.getNextChangeNumber();

    // Generate proposal content
    const content = await generator.generateProposal(
      testFailureId,
      this.config.projectPath,
      changeNumber
    );

    // Create proposal files on filesystem
    const changeId = await generator.createProposalFiles(
      content,
      this.config.projectPath,
      changeNumber
    );

    console.log(`Generated proposal: ${changeId}`);

    // Sync to database
    const syncService = new OpenSpecSyncService(this.db, this.config);
    await syncService.syncFromFilesystem(changeId);

    // Get spec ID from database
    const spec = await this.db
      .select()
      .from(openspecSpecs)
      .where(eq(openspecSpecs.id, changeId))
      .get();

    if (!spec) {
      throw new Error(`Failed to sync spec ${changeId} to database`);
    }

    // Create error proposal record
    const errorProposal = await this.db
      .insert(errorProposals)
      .values({
        testFailureId,
        specId: spec.id,
        autoGeneratedContent: JSON.stringify(content),
        occurrenceCount: 1,
      })
      .returning()
      .get();

    console.log(`Created error proposal record: ${errorProposal.id}`);

    // Emit generated event
    this.emit({
      type: 'proposal_generated',
      errorProposalId: errorProposal.id,
      testFailureId,
      specId: spec.id,
      priority: content.priority,
      classification: content.classification,
    });

    // Auto-add to work queue
    await this.autoQueueProposal(spec.id, content.priority);
  }

  /**
   * Get next change number by checking existing changes
   */
  private async getNextChangeNumber(): Promise<number> {
    const changesPath = path.join(this.config.openspecPath, 'changes');

    try {
      const entries = await fs.readdir(changesPath, { withFileTypes: true });
      const changeDirs = entries.filter(e => e.isDirectory());

      const numbers = changeDirs
        .map(dir => {
          const match = dir.name.match(/^(\d+)-/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(n => n > 0);

      return numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
    } catch (error) {
      console.warn('Could not read changes directory:', error);
      return 1;
    }
  }

  /**
   * Auto-add proposal to work queue
   */
  private async autoQueueProposal(specId: string, priority: number): Promise<void> {
    try {
      const queueService = new WorkQueueService(this.db);
      await queueService.addToQueue(this.config.projectId, specId, priority);
      console.log(`Added spec ${specId} to work queue with priority ${priority}`);
    } catch (error) {
      console.error(`Failed to auto-queue spec ${specId}:`, error);
      // Non-fatal error, continue
    }
  }

  /**
   * Check if priority should escalate based on occurrence count
   */
  private async checkPriorityEscalation(
    errorProposalId: number,
    occurrenceCount: number
  ): Promise<void> {
    const escalationThresholds = [
      { count: 2, priority: 3, reason: 'Escalated from NEW to FLAKY' },
      { count: 3, priority: 4, reason: 'Escalated from FLAKY to RECURRING' },
      { count: 4, priority: 5, reason: 'Escalated to PERSISTENT' },
    ];

    const threshold = escalationThresholds.find(t => t.count === occurrenceCount);
    if (!threshold) {
      return; // No escalation needed
    }

    // Get error proposal
    const proposal = await this.db
      .select()
      .from(errorProposals)
      .where(eq(errorProposals.id, errorProposalId))
      .get();

    if (!proposal || !proposal.specId) {
      return;
    }

    // Parse auto-generated content to get old priority
    const content = proposal.autoGeneratedContent
      ? JSON.parse(proposal.autoGeneratedContent)
      : null;
    const oldPriority = content?.priority ?? 2;

    if (oldPriority >= threshold.priority) {
      return; // Already at or above this priority
    }

    console.log(`Escalating priority for error proposal ${errorProposalId} to ${threshold.priority}`);

    // Update work queue item priority if exists
    const workQueueService = new WorkQueueService(this.db);
    try {
      await workQueueService.updatePriority(proposal.specId, threshold.priority);
    } catch (error) {
      console.warn(`Could not update work queue priority:`, error);
    }

    // Emit escalation event
    this.emit({
      type: 'priority_escalated',
      errorProposalId,
      oldPriority,
      newPriority: threshold.priority,
      reason: threshold.reason,
    });
  }
}
