export interface TestFailure {
  testName: string;
  testFile: string;
  lineNumber?: number;
  errorMessage: string;
  stackTrace?: string;
  duration?: number;
}

export interface PlaywrightReportStats {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  failures: TestFailure[];
}

export interface PlaywrightTestData {
  config?: {
    projects?: Array<{
      name: string;
      testDir?: string;
    }>;
  };
  suites?: Array<{
    title: string;
    file: string;
    specs?: Array<{
      title: string;
      tests?: Array<{
        status: 'passed' | 'failed' | 'skipped' | 'timedOut';
        duration?: number;
        results?: Array<{
          error?: {
            message?: string;
            stack?: string;
          };
          errors?: Array<{
            message?: string;
            stack?: string;
            location?: {
              file: string;
              line: number;
              column: number;
            };
          }>;
        }>;
      }>;
    }>;
  }>;
}
