import type { FailureHistory } from '@homelab/db';
import type { ClassificationType, ClassificationResult } from './types';

/**
 * Classification thresholds
 */
const FLAKY_THRESHOLD = 0.3; // <30% failure rate = flaky
const PERSISTENT_THRESHOLD = 0.8; // >80% failure rate = persistent
const CONSECUTIVE_PERSISTENT = 5; // 5+ consecutive failures = persistent

/**
 * Classify a test failure based on its history
 *
 * Classification rules:
 * - NEW: First time seeing this failure (occurrences === 1)
 * - FLAKY: Intermittent failures (<30% failure rate)
 * - PERSISTENT: Consistent failures (>80% failure rate OR 5+ consecutive failures)
 * - RECURRING: Everything in between (30-80% failure rate)
 */
export function classifyFailure(history: FailureHistory | null): ClassificationType {
  // New failure
  if (!history || history.occurrences === 1) {
    return 'NEW';
  }

  const failureRate = history.occurrences / history.totalRuns;

  // Persistent: high failure rate OR many consecutive failures
  if (
    failureRate > PERSISTENT_THRESHOLD ||
    history.consecutiveFailures >= CONSECUTIVE_PERSISTENT
  ) {
    return 'PERSISTENT';
  }

  // Flaky: low failure rate
  if (failureRate < FLAKY_THRESHOLD) {
    return 'FLAKY';
  }

  // Recurring: everything else
  return 'RECURRING';
}

/**
 * Determine if test matches pattern (regex or glob-style)
 */
export function matchesPattern(testName: string, pattern: string): boolean {
  try {
    const regex = new RegExp(pattern);
    return regex.test(testName);
  } catch {
    // If regex is invalid, try simple glob-style matching
    const globPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    const regex = new RegExp(`^${globPattern}$`);
    return regex.test(testName);
  }
}

/**
 * Check if test should be excluded
 */
export function isExcluded(testName: string, excludePatterns?: string[]): boolean {
  if (!excludePatterns || excludePatterns.length === 0) return false;
  return excludePatterns.some(pattern => matchesPattern(testName, pattern));
}

/**
 * Check if test is critical
 */
export function isCritical(testName: string, criticalPatterns?: string[]): boolean {
  if (!criticalPatterns || criticalPatterns.length === 0) return false;
  return criticalPatterns.some(pattern => matchesPattern(testName, pattern));
}

/**
 * Full classification with notification decision
 */
export function classifyWithNotification(
  history: FailureHistory | null,
  testName: string,
  criticalPatterns?: string[],
  excludePatterns?: string[],
  includeFlaky: boolean = false,
  onlyNewFailures: boolean = true
): ClassificationResult {
  // Check exclusions first
  if (isExcluded(testName, excludePatterns)) {
    return {
      type: history ? classifyFailure(history) : 'NEW',
      shouldNotify: false,
      reason: 'Test matches exclusion pattern'
    };
  }

  const classification = classifyFailure(history);

  // Critical tests always notify
  if (isCritical(testName, criticalPatterns)) {
    return {
      type: classification,
      shouldNotify: true,
      reason: 'Critical test failure'
    };
  }

  // Check notification criteria
  let shouldNotify = false;
  let reason = '';

  switch (classification) {
    case 'NEW':
      shouldNotify = true;
      reason = 'New failure detected';
      break;

    case 'FLAKY':
      shouldNotify = includeFlaky;
      reason = includeFlaky ? 'Flaky test failure' : 'Flaky test (notifications disabled)';
      break;

    case 'RECURRING':
      shouldNotify = !onlyNewFailures;
      reason = onlyNewFailures ? 'Recurring failure (only new failures enabled)' : 'Recurring failure detected';
      break;

    case 'PERSISTENT':
      shouldNotify = !onlyNewFailures;
      reason = onlyNewFailures ? 'Persistent failure (only new failures enabled)' : 'Persistent failure detected';
      break;
  }

  return {
    type: classification,
    shouldNotify,
    reason
  };
}
