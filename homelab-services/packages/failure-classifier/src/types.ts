export type ClassificationType = 'NEW' | 'FLAKY' | 'RECURRING' | 'PERSISTENT';

export interface ClassificationResult {
  type: ClassificationType;
  shouldNotify: boolean;
  reason: string;
}

export interface FailureData {
  testName: string;
  testFile?: string;
  lineNumber?: number;
  errorMessage: string;
  stackTrace?: string;
}

export interface ThresholdCriteria {
  enabled: boolean;
  minFailedTests: number;
  failureRate: number; // 0-100
  includeFlaky: boolean;
  onlyNewFailures: boolean;
  criticalTestPatterns?: string[];
  excludeTestPatterns?: string[];
}
