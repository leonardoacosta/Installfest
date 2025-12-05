import { describe, it, expect } from 'vitest';
import {
  extractTestName,
  extractErrorMessage,
  extractStackTrace,
  classifyErrorType,
  inferFixFromErrorType,
  extractAffectedFiles,
  calculatePriority,
  formatTimestamp,
} from '../error-analysis';

describe('extractTestName', () => {
  it('should remove test framework prefixes', () => {
    expect(extractTestName('describe should do something')).toBe('Should do something');
    expect(extractTestName('it should work')).toBe('Should work');
    expect(extractTestName('test user authentication')).toBe('User authentication');
  });

  it('should remove file extensions', () => {
    expect(extractTestName('login.test.ts')).toBe('Login');
    expect(extractTestName('auth.spec.js')).toBe('Auth');
  });

  it('should capitalize first letter', () => {
    expect(extractTestName('user login flow')).toBe('User login flow');
  });

  it('should handle empty strings', () => {
    expect(extractTestName('')).toBe('');
  });
});

describe('extractErrorMessage', () => {
  it('should extract first line of error', () => {
    const error = 'TypeError: Cannot read property\nLine 2\nLine 3';
    expect(extractErrorMessage(error)).toBe("Cannot read property");
  });

  it('should remove common error prefixes', () => {
    expect(extractErrorMessage('Error: Something went wrong')).toBe('Something went wrong');
    expect(extractErrorMessage('TypeError: Invalid type')).toBe('Invalid type');
    expect(extractErrorMessage('AssertionError: Expected true')).toBe('Expected true');
  });

  it('should handle undefined error', () => {
    expect(extractErrorMessage(undefined)).toBe('Unknown error');
  });

  it('should handle empty error', () => {
    expect(extractErrorMessage('')).toBe('Unknown error');
  });
});

describe('extractStackTrace', () => {
  it('should extract first 10 lines', () => {
    const stack = Array.from({ length: 20 }, (_, i) => `Line ${i + 1}`).join('\n');
    const result = extractStackTrace(stack);
    const lines = result.split('\n');
    expect(lines.length).toBe(10);
    expect(lines[0]).toBe('Line 1');
    expect(lines[9]).toBe('Line 10');
  });

  it('should handle undefined stack trace', () => {
    expect(extractStackTrace(undefined)).toBe('');
  });

  it('should filter empty lines', () => {
    const stack = 'Line 1\n\n\nLine 2\n\n';
    const result = extractStackTrace(stack);
    expect(result).toBe('Line 1\nLine 2');
  });
});

describe('classifyErrorType', () => {
  it('should classify type errors', () => {
    expect(classifyErrorType('is not assignable to type string')).toBe('type-error');
    expect(classifyErrorType('Type mismatch detected')).toBe('type-error');
    expect(classifyErrorType('Expected type number')).toBe('type-error');
  });

  it('should classify missing property errors', () => {
    expect(classifyErrorType('Property foo does not exist')).toBe('missing-property');
    expect(classifyErrorType('undefined is not an object')).toBe('missing-property');
    expect(classifyErrorType('Cannot read property of undefined')).toBe('missing-property');
  });

  it('should classify assertion failures', () => {
    expect(classifyErrorType('Expected true but got false')).toBe('assertion-failure');
    expect(classifyErrorType('Expected 5 to equal 10')).toBe('assertion-failure');
    expect(classifyErrorType('Assertion failed: condition not met')).toBe('assertion-failure');
  });

  it('should classify network errors', () => {
    expect(classifyErrorType('Request timeout after 30s')).toBe('network-error');
    expect(classifyErrorType('Connection refused')).toBe('network-error');
    expect(classifyErrorType('ECONNREFUSED')).toBe('network-error');
    expect(classifyErrorType('Fetch failed')).toBe('network-error');
  });

  it('should classify configuration errors', () => {
    expect(classifyErrorType('Config file not found')).toBe('configuration-error');
    expect(classifyErrorType('Module not found')).toBe('configuration-error');
    expect(classifyErrorType('Missing environment variable')).toBe('configuration-error');
  });

  it('should default to other for unrecognized errors', () => {
    expect(classifyErrorType('Something random happened')).toBe('other');
  });
});

describe('inferFixFromErrorType', () => {
  it('should suggest fix for type errors', () => {
    const fix = inferFixFromErrorType('type-error', 'Type mismatch');
    expect(fix).toContain('type definitions');
  });

  it('should suggest fix for missing property', () => {
    const fix = inferFixFromErrorType('missing-property', 'Property "username" does not exist');
    expect(fix).toContain('username');
    expect(fix).toContain('Add');
  });

  it('should suggest fix for assertion failures', () => {
    const fix = inferFixFromErrorType('assertion-failure', 'Expected true to be false');
    expect(fix).toContain('functionality');
  });

  it('should suggest fix for network errors', () => {
    const fix = inferFixFromErrorType('network-error', 'Timeout');
    expect(fix).toContain('retry');
    expect(fix).toContain('timeout');
  });

  it('should suggest fix for configuration errors', () => {
    const fix = inferFixFromErrorType('configuration-error', 'Config not found');
    expect(fix).toContain('configuration');
  });

  it('should provide generic fix for other errors', () => {
    const fix = inferFixFromErrorType('other', 'Random error');
    expect(fix).toContain('Investigate');
  });
});

describe('extractAffectedFiles', () => {
  it('should extract file paths from stack trace', () => {
    const stack = `
      at Object.<anonymous> (/path/to/file.ts:10:5)
      at Module._compile (/path/to/another.js:20:10)
      at processTicksAndRejections (node:internal/process:15:8)
    `;
    const files = extractAffectedFiles(stack);
    expect(files).toContain('/path/to/file.ts');
    expect(files).toContain('/path/to/another.js');
  });

  it('should filter out node_modules', () => {
    const stack = `
      at /path/to/file.ts:10:5
      at /node_modules/package/index.js:5:10
    `;
    const files = extractAffectedFiles(stack);
    expect(files).toContain('/path/to/file.ts');
    expect(files).not.toContain('/node_modules/package/index.js');
  });

  it('should limit to 5 files', () => {
    const stack = Array.from({ length: 10 }, (_, i) =>
      `at /path/to/file${i}.ts:10:5`
    ).join('\n');
    const files = extractAffectedFiles(stack);
    expect(files.length).toBeLessThanOrEqual(5);
  });

  it('should handle undefined stack trace', () => {
    expect(extractAffectedFiles(undefined)).toEqual([]);
  });
});

describe('calculatePriority', () => {
  it('should assign base priority by classification', () => {
    expect(calculatePriority('NEW', 1)).toBe(2);
    expect(calculatePriority('FLAKY', 1)).toBe(3);
    expect(calculatePriority('RECURRING', 1)).toBe(4);
    expect(calculatePriority('PERSISTENT', 1)).toBe(5);
  });

  it('should escalate NEW to FLAKY level after 2 occurrences', () => {
    expect(calculatePriority('NEW', 2)).toBe(3);
    expect(calculatePriority('NEW', 3)).toBe(3);
  });

  it('should escalate FLAKY to RECURRING level after 3 occurrences', () => {
    expect(calculatePriority('FLAKY', 3)).toBe(4);
    expect(calculatePriority('FLAKY', 4)).toBe(4);
  });

  it('should escalate RECURRING to PERSISTENT level after 4 occurrences', () => {
    expect(calculatePriority('RECURRING', 4)).toBe(5);
    expect(calculatePriority('RECURRING', 5)).toBe(5);
  });

  it('should keep PERSISTENT at max priority', () => {
    expect(calculatePriority('PERSISTENT', 10)).toBe(5);
  });
});

describe('formatTimestamp', () => {
  it('should format date with month, day, year, hour, minute', () => {
    const date = new Date('2024-03-15T14:30:00');
    const formatted = formatTimestamp(date);
    expect(formatted).toMatch(/Mar/);
    expect(formatted).toMatch(/15/);
    expect(formatted).toMatch(/2024/);
    expect(formatted).toMatch(/2:30/);
  });
});
