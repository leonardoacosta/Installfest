import type { ThresholdCriteria } from './types';
import type { FailureHistory } from '@homelab/db';
import { classifyWithNotification } from './classifier';

export interface ThresholdEvaluationResult {
  shouldTrigger: boolean;
  reason: string;
  failureCount: number;
  notifiableFailures: string[];
}

/**
 * Evaluate if failures meet threshold criteria for notification
 */
export function evaluateThreshold(
  failures: Array<{ testName: string; history: FailureHistory | null }>,
  criteria: ThresholdCriteria
): ThresholdEvaluationResult {
  if (!criteria.enabled) {
    return {
      shouldTrigger: false,
      reason: 'Notifications disabled',
      failureCount: failures.length,
      notifiableFailures: []
    };
  }

  // Filter failures based on classification and criteria
  const notifiableFailures: string[] = [];

  for (const failure of failures) {
    const classification = classifyWithNotification(
      failure.history,
      failure.testName,
      criteria.criticalTestPatterns,
      criteria.excludeTestPatterns,
      criteria.includeFlaky,
      criteria.onlyNewFailures
    );

    if (classification.shouldNotify) {
      notifiableFailures.push(failure.testName);
    }
  }

  // Check minimum failed tests threshold
  if (notifiableFailures.length < criteria.minFailedTests) {
    return {
      shouldTrigger: false,
      reason: `Only ${notifiableFailures.length} notifiable failures (minimum: ${criteria.minFailedTests})`,
      failureCount: failures.length,
      notifiableFailures
    };
  }

  // Check failure rate threshold if configured
  if (criteria.failureRate > 0) {
    const totalTests = failures.length; // This should ideally come from report total
    const actualRate = (notifiableFailures.length / totalTests) * 100;

    if (actualRate < criteria.failureRate) {
      return {
        shouldTrigger: false,
        reason: `Failure rate ${actualRate.toFixed(1)}% below threshold ${criteria.failureRate}%`,
        failureCount: failures.length,
        notifiableFailures
      };
    }
  }

  return {
    shouldTrigger: true,
    reason: `${notifiableFailures.length} notifiable failures meet threshold criteria`,
    failureCount: failures.length,
    notifiableFailures
  };
}
