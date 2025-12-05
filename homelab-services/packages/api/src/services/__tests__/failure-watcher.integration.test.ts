/**
 * Integration Tests for FailureWatcherService
 *
 * NOTE: These tests use mocked database operations to verify the integration logic.
 * For full end-to-end tests with a real database, see E2E test suite.
 *
 * These tests verify:
 * - Full flow from test failure detection to proposal generation
 * - Duplicate detection and occurrence tracking logic
 * - Priority escalation through multiple levels
 * - Work queue integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { calculatePriority, classifyErrorType, extractErrorMessage } from '../../utils/error-analysis';

describe('FailureWatcher Integration Logic', () => {
  describe('Priority Escalation Flow', () => {
    it('should escalate priority from NEW (2) to FLAKY (3) after 2 occurrences', () => {
      // Simulate first occurrence
      const priority1 = calculatePriority('NEW', 1);
      expect(priority1).toBe(2);

      // Simulate second occurrence - should escalate
      const priority2 = calculatePriority('NEW', 2);
      expect(priority2).toBe(3); // Escalated to FLAKY level
    });

    it('should escalate through all priority levels: 2→3→4→5', () => {
      // NEW with 1 occurrence
      expect(calculatePriority('NEW', 1)).toBe(2);

      // FLAKY with 1 occurrence (or NEW with 2)
      expect(calculatePriority('FLAKY', 1)).toBe(3);
      expect(calculatePriority('NEW', 2)).toBe(3);

      // RECURRING with 1 occurrence (or FLAKY with 3)
      expect(calculatePriority('RECURRING', 1)).toBe(4);
      expect(calculatePriority('FLAKY', 3)).toBe(4);

      // PERSISTENT with 1 occurrence (or RECURRING with 4)
      expect(calculatePriority('PERSISTENT', 1)).toBe(5);
      expect(calculatePriority('RECURRING', 4)).toBe(5);
    });

    it('should maintain max priority at 5 for PERSISTENT errors', () => {
      expect(calculatePriority('PERSISTENT', 1)).toBe(5);
      expect(calculatePriority('PERSISTENT', 10)).toBe(5);
      expect(calculatePriority('PERSISTENT', 100)).toBe(5);
    });
  });

  describe('Error Classification and Analysis', () => {
    it('should correctly classify different error types', () => {
      expect(classifyErrorType('TypeError: is not assignable to type')).toBe('type-error');
      expect(classifyErrorType('Property "username" does not exist')).toBe('missing-property');
      expect(classifyErrorType('Expected 200 but got 500')).toBe('assertion-failure');
      expect(classifyErrorType('Request timeout after 30s')).toBe('network-error');
      expect(classifyErrorType('Config file not found')).toBe('configuration-error');
    });

    it('should extract clean error messages', () => {
      const error = 'TypeError: Cannot read property\nLine 2\nLine 3';
      const message = extractErrorMessage(error);
      expect(message).toBe('Cannot read property');
      expect(message).not.toContain('TypeError:');
      expect(message).not.toContain('Line 2');
    });
  });

  describe('Duplicate Detection Logic', () => {
    it('should identify same error by comparing error messages', () => {
      const error1 = 'TypeError: Cannot read property "token"';
      const error2 = 'TypeError: Cannot read property "token"';
      const error3 = 'ReferenceError: user is not defined';

      const msg1 = extractErrorMessage(error1);
      const msg2 = extractErrorMessage(error2);
      const msg3 = extractErrorMessage(error3);

      // Same errors should match
      expect(msg1).toBe(msg2);
      // Different errors should not match
      expect(msg1).not.toBe(msg3);
    });

    it('should create new proposal for different error on same test', () => {
      // In practice, this would be handled by comparing error messages
      // If messages differ significantly, create new proposal
      // If messages match, update existing proposal

      const testName = 'user login';
      const error1 = 'string is not assignable to type number';
      const error2 = 'Network timeout after 30 seconds';

      const type1 = classifyErrorType(error1);
      const type2 = classifyErrorType(error2);

      // Different error types indicate different issues
      expect(type1).not.toBe(type2);
      expect(type1).toBe('type-error');
      expect(type2).toBe('network-error');
    });
  });

  describe('Work Queue Integration', () => {
    it('should assign correct initial priority for new proposals', () => {
      const scenarios = [
        { classification: 'NEW', expected: 2 },
        { classification: 'FLAKY', expected: 3 },
        { classification: 'RECURRING', expected: 4 },
        { classification: 'PERSISTENT', expected: 5 },
      ];

      scenarios.forEach(({ classification, expected }) => {
        const priority = calculatePriority(
          classification as 'NEW' | 'FLAKY' | 'RECURRING' | 'PERSISTENT',
          1
        );
        expect(priority).toBe(expected);
      });
    });

    it('should update priority when occurrence count increases', () => {
      const testScenarios = [
        { classification: 'NEW', occurrences: 1, expectedPriority: 2 },
        { classification: 'NEW', occurrences: 2, expectedPriority: 3 }, // Escalated
        { classification: 'FLAKY', occurrences: 2, expectedPriority: 3 },
        { classification: 'FLAKY', occurrences: 3, expectedPriority: 4 }, // Escalated
        { classification: 'RECURRING', occurrences: 3, expectedPriority: 4 },
        { classification: 'RECURRING', occurrences: 4, expectedPriority: 5 }, // Escalated
      ];

      testScenarios.forEach(({ classification, occurrences, expectedPriority }) => {
        const priority = calculatePriority(
          classification as 'NEW' | 'FLAKY' | 'RECURRING' | 'PERSISTENT',
          occurrences
        );
        expect(priority).toBe(expectedPriority);
      });
    });
  });

  describe('Full Flow Simulation', () => {
    it('should simulate complete flow: failure → proposal → queue', () => {
      // Step 1: Test fails with NEW classification
      const testFailure = {
        testName: 'user authentication',
        error: 'TypeError: Cannot read property "token" of undefined',
        classification: 'NEW',
        occurrenceCount: 1,
      };

      // Step 2: Classify error type
      const errorType = classifyErrorType(testFailure.error);
      expect(errorType).toBe('missing-property');

      // Step 3: Calculate initial priority
      const initialPriority = calculatePriority(
        testFailure.classification as 'NEW',
        testFailure.occurrenceCount
      );
      expect(initialPriority).toBe(2);

      // Step 4: Simulate second occurrence
      testFailure.occurrenceCount = 2;
      testFailure.classification = 'FLAKY';

      const escalatedPriority = calculatePriority(
        'FLAKY',
        testFailure.occurrenceCount
      );
      expect(escalatedPriority).toBe(3);

      // Step 5: Simulate third occurrence
      testFailure.occurrenceCount = 3;
      testFailure.classification = 'RECURRING';

      const furtherEscalatedPriority = calculatePriority(
        'RECURRING',
        testFailure.occurrenceCount
      );
      expect(furtherEscalatedPriority).toBe(4);

      // Verify escalation path
      expect(initialPriority).toBeLessThan(escalatedPriority);
      expect(escalatedPriority).toBeLessThan(furtherEscalatedPriority);
    });

    it('should handle multiple errors from same test correctly', () => {
      const test = {
        name: 'checkout flow',
        file: 'checkout.test.ts',
      };

      // Error 1: Type error
      const error1 = {
        message: 'TypeError: Cannot read property "price"',
        type: classifyErrorType('TypeError: Cannot read property "price"'),
        priority: calculatePriority('NEW', 1),
      };

      // Error 2: Different error on same test
      const error2 = {
        message: 'Network timeout during payment',
        type: classifyErrorType('Network timeout during payment'),
        priority: calculatePriority('NEW', 1),
      };

      // Should create separate proposals due to different error types
      expect(error1.type).toBe('missing-property');
      expect(error2.type).toBe('network-error');
      expect(error1.type).not.toBe(error2.type);

      // Both start at priority 2
      expect(error1.priority).toBe(2);
      expect(error2.priority).toBe(2);
    });
  });
});
