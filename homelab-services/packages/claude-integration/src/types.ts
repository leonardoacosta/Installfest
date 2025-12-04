export interface TestFailureNotification {
  workflow: string;
  runNumber?: number;
  reportId: number;
  failures: Array<{
    testName: string;
    testFile?: string;
    lineNumber?: number;
    errorMessage: string;
    stackTrace?: string;
    classificationType: 'NEW' | 'FLAKY' | 'RECURRING' | 'PERSISTENT';
  }>;
  totalTests: number;
  failedTests: number;
  passedTests: number;
  timestamp: Date;
}

export interface NotificationResult {
  success: boolean;
  sessionId?: string;
  error?: string;
}

export interface RateLimitConfig {
  perWorkflow: number; // Max notifications per workflow per hour
  global: number; // Max total notifications per hour
}

export interface ClaudeIntegrationConfig {
  serverUrl: string;
  enabled: boolean;
  rateLimit: RateLimitConfig;
  retryAttempts: number;
  retryDelayMs: number;
}
