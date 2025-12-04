export { classifyFailure, classifyWithNotification, matchesPattern, isExcluded, isCritical } from './classifier';
export { updateFailureHistory, calculateFailureRate, hasRecovered, createTestIdentifier } from './history';
export { evaluateThreshold } from './threshold';
export type {
  ClassificationType,
  ClassificationResult,
  FailureData,
  ThresholdCriteria
} from './types';
export type { ThresholdEvaluationResult } from './threshold';
