/**
 * File Watcher Service
 *
 * Monitors /reports directory for new Playwright reports.
 * Parses reports, updates failure history, evaluates thresholds, and triggers notifications.
 */

import * as chokidar from 'chokidar';
import * as path from 'path';
import * as fs from 'fs';
import { parsePlaywrightReport } from '@homelab/report-parser';
import {
  classifyFailure,
  updateFailureHistory,
  evaluateThreshold,
  type ThresholdCriteria,
} from '@homelab/failure-classifier';
import { ClaudeIntegrationClient, type ClaudeIntegrationConfig } from '@homelab/claude-integration';
import { getDb } from '@homelab/db';

export interface WatcherConfig {
  reportsDir: string;
  dbPath: string;
  claudeConfig: ClaudeIntegrationConfig;
}

export class ReportWatcher {
  private watcher: chokidar.FSWatcher | null = null;
  private config: WatcherConfig;
  private claudeClient: ClaudeIntegrationClient;
  private db: ReturnType<typeof getDb>;
  private processedReports = new Set<string>();

  constructor(config: WatcherConfig) {
    this.config = config;
    this.claudeClient = new ClaudeIntegrationClient(config.claudeConfig);
    this.db = getDb(config.dbPath);
  }

  /**
   * Start watching for reports
   */
  start(): void {
    if (this.watcher) {
      console.warn('Watcher already started');
      return;
    }

    if (!fs.existsSync(this.config.reportsDir)) {
      console.warn(`Reports directory does not exist: ${this.config.reportsDir}`);
      console.warn('Creating directory...');
      fs.mkdirSync(this.config.reportsDir, { recursive: true });
    }

    console.log('Starting file watcher on:', this.config.reportsDir);

    this.watcher = chokidar.watch(this.config.reportsDir, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: false,
      depth: 5,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100,
      },
    });

    this.watcher.on('add', (filePath) => {
      if (path.basename(filePath) === 'index.html') {
        this.handleNewReport(filePath);
      }
    });

    this.watcher.on('error', (error) => {
      console.error('File watcher error:', error);
    });

    // Process retry queue periodically
    setInterval(() => {
      this.claudeClient.processRetryQueue();
    }, 60000); // Every minute

    console.log('File watcher started');
  }

  /**
   * Stop watching
   */
  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
      console.log('File watcher stopped');
    }
  }

  /**
   * Handle new report file
   */
  private async handleNewReport(htmlPath: string): Promise<void> {
    // Prevent reprocessing
    if (this.processedReports.has(htmlPath)) {
      return;
    }

    this.processedReports.add(htmlPath);

    console.log('New report detected:', htmlPath);

    try {
      const relativePath = path.relative(this.config.reportsDir, htmlPath);
      const pathParts = relativePath.split(path.sep);

      // Expected structure: /reports/{workflow}/{run_id}/index.html
      if (pathParts.length < 3) {
        console.warn('Unexpected path structure:', relativePath);
        return;
      }

      const workflow = pathParts[0];
      const runId = pathParts[1];

      // Parse report
      const stats = parsePlaywrightReport(htmlPath);

      // Generate hash for deduplication
      const hash = `${workflow}-${runId}`;

      // Insert or update report in database
      const reportResult = this.db
        .prepare(
          `INSERT INTO reports
           (workflow_name, run_number, hash, file_path, total_tests, passed, failed, skipped, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(hash) DO UPDATE SET
             total_tests = excluded.total_tests,
             passed = excluded.passed,
             failed = excluded.failed,
             skipped = excluded.skipped,
             status = excluded.status
           RETURNING id`
        )
        .get(
          workflow,
          parseInt(runId, 10) || null,
          hash,
          relativePath,
          stats.total,
          stats.passed,
          stats.failed,
          stats.skipped,
          stats.failed > 0 ? (stats.passed > 0 ? 'mixed' : 'failed') : 'passed'
        ) as { id: number };

      const reportId = reportResult.id;

      console.log(`Report indexed: ${workflow} #${runId} (ID: ${reportId})`);

      // Process failures if any
      if (stats.failures.length > 0) {
        await this.processFailures(reportId, workflow, stats.failures, stats.total);
      }
    } catch (error) {
      console.error('Error processing report:', htmlPath, error);
      this.processedReports.delete(htmlPath); // Allow retry
    }
  }

  /**
   * Process test failures
   */
  private async processFailures(
    reportId: number,
    workflow: string,
    failures: Array<{
      testName: string;
      testFile?: string;
      lineNumber?: number;
      errorMessage: string;
      stackTrace?: string;
      duration?: number;
    }>,
    totalTests: number
  ): Promise<void> {
    const failureHistories: Array<{ testName: string; history: any }> = [];

    for (const failure of failures) {
      // Insert test failure record
      this.db
        .prepare(
          `INSERT INTO test_failures
           (report_id, test_name, test_file, line_number, error, stack_trace, duration)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          reportId,
          failure.testName,
          failure.testFile || null,
          failure.lineNumber || null,
          failure.errorMessage,
          failure.stackTrace || null,
          failure.duration || null
        );

      // Get or create failure history
      let history = this.db
        .prepare('SELECT * FROM failure_history WHERE test_name = ?')
        .get(failure.testName) as any;

      if (history) {
        // Update existing history
        const updated = updateFailureHistory(
          {
            occurrences: history.occurrences,
            consecutiveFailures: history.consecutive_failures,
            totalRuns: history.total_runs,
            lastSeen: new Date(history.last_seen * 1000),
          },
          true
        );

        const classification = classifyFailure(history);

        this.db
          .prepare(
            `UPDATE failure_history
             SET occurrences = ?,
                 consecutive_failures = ?,
                 total_runs = ?,
                 last_seen = ?,
                 classification_type = ?,
                 test_file = ?,
                 line_number = ?
             WHERE test_name = ?`
          )
          .run(
            updated.occurrences,
            updated.consecutiveFailures,
            updated.totalRuns,
            Math.floor(updated.lastSeen.getTime() / 1000),
            classification,
            failure.testFile || null,
            failure.lineNumber || null,
            failure.testName
          );

        // Refresh history for classification
        history = this.db
          .prepare('SELECT * FROM failure_history WHERE test_name = ?')
          .get(failure.testName);
      } else {
        // Create new history
        const classification = 'NEW';

        const result = this.db
          .prepare(
            `INSERT INTO failure_history
             (test_name, test_file, line_number, occurrences, consecutive_failures, total_runs, classification_type)
             VALUES (?, ?, ?, 1, 1, 1, ?)
             RETURNING *`
          )
          .get(
            failure.testName,
            failure.testFile || null,
            failure.lineNumber || null,
            classification
          );

        history = result;
      }

      failureHistories.push({ testName: failure.testName, history });
    }

    // Evaluate thresholds
    await this.evaluateAndNotify(reportId, workflow, failures, failureHistories, totalTests);
  }

  /**
   * Evaluate thresholds and send notifications
   */
  private async evaluateAndNotify(
    reportId: number,
    workflow: string,
    failures: Array<{
      testName: string;
      testFile?: string;
      lineNumber?: number;
      errorMessage: string;
      stackTrace?: string;
    }>,
    failureHistories: Array<{ testName: string; history: any }>,
    totalTests: number
  ): Promise<void> {
    // Get threshold config
    const config = this.db
      .prepare('SELECT * FROM threshold_config ORDER BY id DESC LIMIT 1')
      .get() as any;

    if (!config || !config.enabled) {
      console.log('Notifications disabled');
      return;
    }

    // Parse patterns from JSON
    const criticalPatterns = config.critical_test_patterns
      ? JSON.parse(config.critical_test_patterns)
      : [];
    const excludePatterns = config.exclude_test_patterns
      ? JSON.parse(config.exclude_test_patterns)
      : [];

    const criteria: ThresholdCriteria = {
      enabled: config.enabled,
      minFailedTests: config.min_failed_tests,
      failureRate: config.failure_rate,
      includeFlaky: config.include_flaky,
      onlyNewFailures: config.only_new_failures,
      criticalTestPatterns: criticalPatterns,
      excludeTestPatterns: excludePatterns,
    };

    const evaluation = evaluateThreshold(failureHistories, criteria);

    console.log('Threshold evaluation:', evaluation);

    if (evaluation.shouldTrigger) {
      // Prepare notification
      const notificationFailures = failures
        .filter((f) => evaluation.notifiableFailures.includes(f.testName))
        .map((f) => {
          const history = failureHistories.find(
            (h) => h.testName === f.testName
          )?.history;

          return {
            testName: f.testName,
            testFile: f.testFile,
            lineNumber: f.lineNumber,
            errorMessage: f.errorMessage,
            stackTrace: f.stackTrace,
            classificationType: history?.classification_type || 'NEW',
          };
        });

      const result = await this.claudeClient.notify({
        workflow,
        reportId,
        failures: notificationFailures,
        totalTests,
        failedTests: failures.length,
        passedTests: totalTests - failures.length,
        timestamp: new Date(),
      });

      if (result.success) {
        console.log('Claude notification sent successfully:', result.sessionId);

        // Create remediation attempts for each failure
        for (const failure of notificationFailures) {
          this.db
            .prepare(
              `INSERT INTO remediation_attempts
               (report_id, test_name, claude_session_id, status, classification_type)
               VALUES (?, ?, ?, 'pending', ?)`
            )
            .run(
              reportId,
              failure.testName,
              result.sessionId || null,
              failure.classificationType
            );
        }
      } else {
        console.error('Failed to send Claude notification:', result.error);
      }
    }
  }

  /**
   * Get watcher statistics
   */
  getStats(): {
    processedReports: number;
    claudeIntegration: ReturnType<ClaudeIntegrationClient['getStats']>;
  } {
    return {
      processedReports: this.processedReports.size,
      claudeIntegration: this.claudeClient.getStats(),
    };
  }
}
