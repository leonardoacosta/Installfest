import type { FailureData } from './types';

/**
 * Update failure history with new occurrence
 * Returns the updated history data (to be persisted by caller)
 */
export function updateFailureHistory(
  existingHistory: {
    occurrences: number;
    consecutiveFailures: number;
    totalRuns: number;
    lastSeen: Date;
  } | null,
  isFailure: boolean,
  currentTime: Date = new Date()
): {
  occurrences: number;
  consecutiveFailures: number;
  totalRuns: number;
  lastSeen: Date;
} {
  if (!existingHistory) {
    // First time seeing this test
    return {
      occurrences: isFailure ? 1 : 0,
      consecutiveFailures: isFailure ? 1 : 0,
      totalRuns: 1,
      lastSeen: currentTime
    };
  }

  // Update existing history
  const updated = {
    occurrences: existingHistory.occurrences + (isFailure ? 1 : 0),
    consecutiveFailures: isFailure ? existingHistory.consecutiveFailures + 1 : 0,
    totalRuns: existingHistory.totalRuns + 1,
    lastSeen: currentTime
  };

  return updated;
}

/**
 * Calculate failure rate
 */
export function calculateFailureRate(occurrences: number, totalRuns: number): number {
  if (totalRuns === 0) return 0;
  return (occurrences / totalRuns) * 100;
}

/**
 * Determine if a test has recovered (passed after failures)
 */
export function hasRecovered(consecutiveFailures: number, isFailure: boolean): boolean {
  return consecutiveFailures > 0 && !isFailure;
}

/**
 * Create a unique test identifier
 */
export function createTestIdentifier(failure: FailureData): string {
  // Use test file + test name as unique identifier
  if (failure.testFile) {
    return `${failure.testFile}::${failure.testName}`;
  }
  return failure.testName;
}
