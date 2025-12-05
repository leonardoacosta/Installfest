/**
 * Error Analysis Utilities
 *
 * Utilities for analyzing test failures and extracting meaningful information
 * for automatic spec proposal generation.
 */

export type ErrorType =
  | 'type-error'
  | 'missing-property'
  | 'assertion-failure'
  | 'network-error'
  | 'configuration-error'
  | 'other';

/**
 * Extract clean test name from stack trace or test name field
 */
export function extractTestName(testName: string, stackTrace?: string): string {
  // Remove common test framework prefixes
  let cleaned = testName
    .replace(/^(describe|it|test|should)\s+/i, '')
    .trim();

  // Remove file extensions if present
  cleaned = cleaned.replace(/\.(test|spec)\.(ts|js|tsx|jsx)$/i, '');

  // Capitalize first letter
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned;
}

/**
 * Extract primary error message from full error string
 */
export function extractErrorMessage(error?: string): string {
  if (!error) return 'Unknown error';

  // Split by newlines and get first non-empty line
  const lines = error.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return 'Unknown error';

  // Return first line, removing common error prefixes
  let message = lines[0];
  message = message.replace(/^(Error:|AssertionError:|TypeError:|ReferenceError:)\s*/i, '');

  return message.trim();
}

/**
 * Extract relevant stack trace lines (first 10 lines)
 */
export function extractStackTrace(stackTrace?: string): string {
  if (!stackTrace) return '';

  const lines = stackTrace.split('\n');
  const relevantLines = lines.slice(0, 10).map(l => l.trim()).filter(l => l.length > 0);

  return relevantLines.join('\n');
}

/**
 * Classify error type based on error message content
 */
export function classifyErrorType(errorMessage: string): ErrorType {
  const lower = errorMessage.toLowerCase();

  // Type errors
  if (
    lower.includes('is not assignable to type') ||
    lower.includes('type mismatch') ||
    lower.includes('expected type') ||
    lower.includes('cannot convert')
  ) {
    return 'type-error';
  }

  // Missing property errors
  if (
    lower.includes('property') && lower.includes('does not exist') ||
    lower.includes('undefined is not an object') ||
    lower.includes('cannot read propert') ||
    lower.includes('has no property')
  ) {
    return 'missing-property';
  }

  // Assertion failures
  if (
    lower.includes('expected') && (lower.includes('but got') || lower.includes('to be') || lower.includes('to equal')) ||
    lower.includes('assertion failed') ||
    lower.includes('expected') && lower.includes('received')
  ) {
    return 'assertion-failure';
  }

  // Network errors
  if (
    lower.includes('timeout') ||
    lower.includes('connection refused') ||
    lower.includes('network error') ||
    lower.includes('econnrefused') ||
    lower.includes('fetch failed')
  ) {
    return 'network-error';
  }

  // Configuration errors
  if (
    lower.includes('config') ||
    lower.includes('not found') && (lower.includes('module') || lower.includes('file')) ||
    lower.includes('missing') && lower.includes('environment') ||
    lower.includes('invalid configuration')
  ) {
    return 'configuration-error';
  }

  return 'other';
}

/**
 * Infer fix approach based on error type
 */
export function inferFixFromErrorType(errorType: ErrorType, errorMessage: string): string {
  switch (errorType) {
    case 'type-error':
      return 'Update type definitions to match actual usage and ensure type consistency across the codebase.';

    case 'missing-property': {
      // Try to extract property name from error message
      const propertyMatch = errorMessage.match(/property ['"`](\w+)['"`]/i);
      const propertyName = propertyMatch ? propertyMatch[1] : 'the missing property';
      return `Add ${propertyName} field to the relevant interface or object to resolve the undefined property error.`;
    }

    case 'assertion-failure': {
      // Try to understand what was expected
      if (errorMessage.toLowerCase().includes('expected') && errorMessage.toLowerCase().includes('to be')) {
        return 'Implement the missing functionality or update the test expectations to match current behavior.';
      }
      return 'Review the assertion logic and implement the feature or fix the implementation to match expected behavior.';
    }

    case 'network-error':
      return 'Add retry logic, timeout handling, and proper error handling for network requests. Consider implementing exponential backoff.';

    case 'configuration-error':
      return 'Update configuration files, environment variables, or module imports to resolve the configuration issue.';

    case 'other':
      return 'Investigate the error and implement an appropriate fix based on the root cause analysis.';

    default:
      return 'Investigate and fix the error';
  }
}

/**
 * Extract affected file paths from stack trace
 */
export function extractAffectedFiles(stackTrace?: string): string[] {
  if (!stackTrace) return [];

  const filePattern = /(?:at\s+)?(?:.*?\s+\()?([^()\s]+\.(?:ts|js|tsx|jsx))(?::\d+)?(?::\d+)?\)?/gi;

  const files = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = filePattern.exec(stackTrace)) !== null) {
    const filePath = match[1];
    // Filter out node_modules and common test framework files
    if (!filePath.includes('node_modules') && !filePath.includes('/dist/')) {
      files.add(filePath);
    }
  }

  return Array.from(files).slice(0, 5); // Return top 5 files
}

/**
 * Calculate priority based on failure classification
 */
export function calculatePriority(
  classification: 'NEW' | 'FLAKY' | 'RECURRING' | 'PERSISTENT',
  occurrenceCount: number = 1
): number {
  const basePriority = {
    NEW: 2,
    FLAKY: 3,
    RECURRING: 4,
    PERSISTENT: 5,
  }[classification];

  // Escalate priority based on occurrence count
  if (classification === 'NEW' && occurrenceCount >= 2) {
    return 3; // Escalate to FLAKY level
  }
  if (classification === 'FLAKY' && occurrenceCount >= 3) {
    return 4; // Escalate to RECURRING level
  }
  if (classification === 'RECURRING' && occurrenceCount >= 4) {
    return 5; // Escalate to PERSISTENT level
  }

  return basePriority;
}

/**
 * Format timestamp for human-readable display
 */
export function formatTimestamp(timestamp: Date): string {
  return timestamp.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
