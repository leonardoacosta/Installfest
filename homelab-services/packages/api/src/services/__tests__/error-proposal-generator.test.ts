import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorProposalGenerator } from '../error-proposal-generator';

// Mock database
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  get: vi.fn(),
} as any;

describe('ErrorProposalGenerator', () => {
  let generator: ErrorProposalGenerator;

  beforeEach(() => {
    vi.clearAllMocks();
    generator = new ErrorProposalGenerator(mockDb);
  });

  describe('generateTitle', () => {
    it('should generate title from test name', () => {
      const title = (generator as any).generateTitle('user login validation');
      expect(title).toBe('Fix: User login validation');
    });

    it('should capitalize first letter', () => {
      const title = (generator as any).generateTitle('authentication flow');
      expect(title).toBe('Fix: Authentication flow');
    });
  });

  describe('generateWhySection', () => {
    it('should include classification', async () => {
      const testFailure = {
        id: 1,
        testName: 'login test',
        testFile: 'auth.test.ts',
        error: 'Type error: string not assignable',
        stackTrace: 'at file.ts:10',
        failedAt: new Date(),
        classification: 'PERSISTENT',
      };

      const why = await (generator as any).generateWhySection(testFailure, 5);
      expect(why).toContain('PERSISTENT');
      expect(why).toContain('Type error: string not assignable');
    });

    it('should include error message in code block', async () => {
      const testFailure = {
        id: 1,
        testName: 'test',
        testFile: 'test.ts',
        error: 'Error message',
        stackTrace: '',
        failedAt: new Date(),
        classification: 'NEW',
      };

      const why = await (generator as any).generateWhySection(testFailure, 2);
      expect(why).toContain('```');
      expect(why).toContain('Error message');
    });

    it('should include failure pattern with occurrence count', async () => {
      const testFailure = {
        id: 1,
        testName: 'test',
        testFile: 'test.ts',
        error: 'Error',
        stackTrace: '',
        failedAt: new Date(),
        classification: 'RECURRING',
      };

      const why = await (generator as any).generateWhySection(testFailure, 3);
      expect(why).toContain('Failure Pattern');
      expect(why).toContain('3 occurrences');
    });
  });

  describe('generateWhatChanges', () => {
    it('should suggest type definition update for type errors', async () => {
      const testFailure = {
        error: 'Type is not assignable',
      };

      const changes = await (generator as any).generateWhatChanges(
        testFailure,
        'type-error',
        ['file.ts']
      );
      expect(changes).toContain('type definitions');
    });

    it('should suggest adding property for missing property errors', async () => {
      const testFailure = {
        error: 'Property username does not exist',
      };

      const changes = await (generator as any).generateWhatChanges(
        testFailure,
        'missing-property',
        ['user.ts']
      );
      expect(changes).toContain('username');
      expect(changes).toContain('Add');
    });

    it('should list affected files', async () => {
      const testFailure = {
        error: 'Error',
      };

      const changes = await (generator as any).generateWhatChanges(
        testFailure,
        'other',
        ['file1.ts', 'file2.ts']
      );
      expect(changes).toContain('file1.ts');
      expect(changes).toContain('file2.ts');
    });
  });

  describe('generateTasks', () => {
    it('should generate investigation task', async () => {
      const testFailure = {
        testFile: 'auth.test.ts',
        error: 'Error',
      };

      const tasks = await (generator as any).generateTasks(
        testFailure,
        'other',
        ['auth.ts']
      );
      expect(tasks).toContain('[ ] 1.');
      expect(tasks).toContain('Investigate');
      expect(tasks).toContain('auth.ts');
    });

    it('should generate fix task based on error type', async () => {
      const testFailure = {
        testFile: 'test.ts',
        error: 'Type error',
      };

      const tasks = await (generator as any).generateTasks(
        testFailure,
        'type-error',
        ['file.ts']
      );
      expect(tasks).toContain('[ ] 2.');
      expect(tasks).toContain('Implement fix');
    });

    it('should include test coverage and verification tasks', async () => {
      const testFailure = {
        testFile: 'test.ts',
        error: 'Error',
      };

      const tasks = await (generator as any).generateTasks(
        testFailure,
        'other',
        []
      );
      expect(tasks).toContain('[ ] 3.');
      expect(tasks).toContain('test coverage');
      expect(tasks).toContain('[ ] 4.');
      expect(tasks).toContain('Run tests');
      expect(tasks).toContain('verify');
    });
  });

  describe('calculatePriority', () => {
    it('should assign priority based on classification', () => {
      const testFailure1 = { classification: 'NEW' };
      const testFailure2 = { classification: 'FLAKY' };
      const testFailure3 = { classification: 'RECURRING' };
      const testFailure4 = { classification: 'PERSISTENT' };

      expect((generator as any).calculatePriority(testFailure1, 1)).toBe(2);
      expect((generator as any).calculatePriority(testFailure2, 1)).toBe(3);
      expect((generator as any).calculatePriority(testFailure3, 1)).toBe(4);
      expect((generator as any).calculatePriority(testFailure4, 1)).toBe(5);
    });

    it('should escalate priority based on occurrence count', () => {
      const testFailure = { classification: 'NEW' };

      // NEW with 1 occurrence = priority 2
      expect((generator as any).calculatePriority(testFailure, 1)).toBe(2);

      // NEW with 2 occurrences = escalate to 3 (FLAKY level)
      expect((generator as any).calculatePriority(testFailure, 2)).toBe(3);
    });
  });

  describe('generateProposal', () => {
    it('should generate complete proposal with all sections', async () => {
      mockDb.get.mockResolvedValue({
        id: 1,
        testName: 'user login test',
        testFile: 'auth.test.ts',
        error: 'Type error: string not assignable',
        stackTrace: 'at auth.ts:10:5',
        failedAt: new Date(),
        classification: 'PERSISTENT',
        occurrenceCount: 5,
      });

      const proposal = await generator.generateProposal(1, '/project/path', 10);

      expect(proposal).toHaveProperty('title');
      expect(proposal).toHaveProperty('why');
      expect(proposal).toHaveProperty('whatChanges');
      expect(proposal).toHaveProperty('tasks');
      expect(proposal).toHaveProperty('priority');
      expect(proposal).toHaveProperty('classification');
      expect(proposal).toHaveProperty('errorType');

      expect(proposal.title).toContain('Fix:');
      expect(proposal.priority).toBeGreaterThanOrEqual(1);
      expect(proposal.priority).toBeLessThanOrEqual(5);
    });

    it('should set correct error type', async () => {
      mockDb.get.mockResolvedValue({
        id: 1,
        testName: 'test',
        testFile: 'test.ts',
        error: 'Property foo does not exist',
        stackTrace: '',
        failedAt: new Date(),
        classification: 'NEW',
        occurrenceCount: 1,
      });

      const proposal = await generator.generateProposal(1, '/path', 1);

      expect(proposal.errorType).toBe('missing-property');
    });

    it('should throw error if test failure not found', async () => {
      mockDb.get.mockResolvedValue(null);

      await expect(
        generator.generateProposal(999, '/path', 1)
      ).rejects.toThrow('Test failure 999 not found');
    });
  });
});
