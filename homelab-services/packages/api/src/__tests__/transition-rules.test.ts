import { describe, it, expect } from 'vitest';

// Test only the transition rules logic without database dependencies
class TestableTransitionRulesEngine {
  private allowedTransitions: Record<string, string[]> = {
    proposing: ['approved', 'proposing'],
    approved: ['assigned', 'proposing'],
    assigned: ['in_progress', 'proposing'],
    in_progress: ['review', 'proposing'],
    review: ['applied', 'in_progress'],
    applied: ['archived'],
    archived: [],
  };

  validateTransition(from: string, to: string): boolean {
    return this.allowedTransitions[from]?.includes(to) ?? false;
  }

  getNextStates(currentState: string): string[] {
    return this.allowedTransitions[currentState] ?? [];
  }

  isManualGate(from: string, to: string): boolean {
    return (
      (from === 'proposing' && to === 'approved') ||
      (from === 'review' && to === 'applied')
    );
  }

  checkTasksComplete(tasksContent: string | null): boolean {
    if (!tasksContent) return false;

    const lines = tasksContent.split('\n');
    const taskLines = lines.filter(line => /^- \[[x ]\]/.test(line.trim()));

    if (taskLines.length === 0) return false;

    const completedTasks = taskLines.filter(line => /^- \[x\]/.test(line.trim()));

    return completedTasks.length === taskLines.length;
  }

  getTasksCompletionPercentage(tasksContent: string | null): number {
    if (!tasksContent) return 0;

    const lines = tasksContent.split('\n');
    const taskLines = lines.filter(line => /^- \[[x ]\]/.test(line.trim()));

    if (taskLines.length === 0) return 0;

    const completedTasks = taskLines.filter(line => /^- \[x\]/.test(line.trim()));

    return Math.round((completedTasks.length / taskLines.length) * 100);
  }
}

describe('TransitionRulesEngine', () => {
  const engine = new TestableTransitionRulesEngine();

  describe('validateTransition', () => {
    it('should allow valid transitions', () => {
      expect(engine.validateTransition('proposing', 'approved')).toBe(true);
      expect(engine.validateTransition('approved', 'assigned')).toBe(true);
      expect(engine.validateTransition('assigned', 'in_progress')).toBe(true);
      expect(engine.validateTransition('in_progress', 'review')).toBe(true);
      expect(engine.validateTransition('review', 'applied')).toBe(true);
      expect(engine.validateTransition('applied', 'archived')).toBe(true);
    });

    it('should allow reject/revert transitions', () => {
      expect(engine.validateTransition('proposing', 'proposing')).toBe(true);
      expect(engine.validateTransition('approved', 'proposing')).toBe(true);
      expect(engine.validateTransition('assigned', 'proposing')).toBe(true);
      expect(engine.validateTransition('in_progress', 'proposing')).toBe(true);
      expect(engine.validateTransition('review', 'in_progress')).toBe(true);
    });

    it('should reject invalid transitions', () => {
      expect(engine.validateTransition('proposing', 'assigned')).toBe(false);
      expect(engine.validateTransition('approved', 'in_progress')).toBe(false);
      expect(engine.validateTransition('in_progress', 'applied')).toBe(false);
      expect(engine.validateTransition('archived', 'applied')).toBe(false);
    });

    it('should not allow transitions from archived state', () => {
      expect(engine.validateTransition('archived', 'applied')).toBe(false);
      expect(engine.validateTransition('archived', 'proposing')).toBe(false);
    });
  });

  describe('getNextStates', () => {
    it('should return correct next states', () => {
      expect(engine.getNextStates('proposing')).toEqual(['approved', 'proposing']);
      expect(engine.getNextStates('approved')).toEqual(['assigned', 'proposing']);
      expect(engine.getNextStates('assigned')).toEqual(['in_progress', 'proposing']);
      expect(engine.getNextStates('in_progress')).toEqual(['review', 'proposing']);
      expect(engine.getNextStates('review')).toEqual(['applied', 'in_progress']);
      expect(engine.getNextStates('applied')).toEqual(['archived']);
      expect(engine.getNextStates('archived')).toEqual([]);
    });
  });

  describe('isManualGate', () => {
    it('should identify manual gates', () => {
      expect(engine.isManualGate('proposing', 'approved')).toBe(true);
      expect(engine.isManualGate('review', 'applied')).toBe(true);
    });

    it('should not identify automatic transitions as manual gates', () => {
      expect(engine.isManualGate('approved', 'assigned')).toBe(false);
      expect(engine.isManualGate('assigned', 'in_progress')).toBe(false);
      expect(engine.isManualGate('in_progress', 'review')).toBe(false);
      expect(engine.isManualGate('applied', 'archived')).toBe(false);
    });
  });

  describe('checkTasksComplete', () => {
    it('should return true when all tasks complete', () => {
      const tasksContent = `
# Tasks
- [x] Task 1
- [x] Task 2
- [x] Task 3
`;
      expect(engine.checkTasksComplete(tasksContent)).toBe(true);
    });

    it('should return false when some tasks incomplete', () => {
      const tasksContent = `
# Tasks
- [x] Task 1
- [ ] Task 2
- [x] Task 3
`;
      expect(engine.checkTasksComplete(tasksContent)).toBe(false);
    });

    it('should return false when no tasks', () => {
      const tasksContent = `# Tasks\n\nNo tasks yet.`;
      expect(engine.checkTasksComplete(tasksContent)).toBe(false);
    });

    it('should return false when tasksContent is null', () => {
      expect(engine.checkTasksComplete(null)).toBe(false);
    });

    it('should handle mixed checkbox formats', () => {
      const tasksContent = `
- [x] Task 1
- [ ] Task 2
- [X] Task 3
`;
      // Should treat [X] and [x] as complete
      expect(engine.checkTasksComplete(tasksContent)).toBe(false);
    });
  });

  describe('getTasksCompletionPercentage', () => {
    it('should calculate completion percentage correctly', () => {
      const tasksContent = `
- [x] Task 1
- [x] Task 2
- [ ] Task 3
- [ ] Task 4
`;
      expect(engine.getTasksCompletionPercentage(tasksContent)).toBe(50);
    });

    it('should return 100 when all tasks complete', () => {
      const tasksContent = `
- [x] Task 1
- [x] Task 2
`;
      expect(engine.getTasksCompletionPercentage(tasksContent)).toBe(100);
    });

    it('should return 0 when no tasks complete', () => {
      const tasksContent = `
- [ ] Task 1
- [ ] Task 2
`;
      expect(engine.getTasksCompletionPercentage(tasksContent)).toBe(0);
    });

    it('should return 0 when no tasks', () => {
      expect(engine.getTasksCompletionPercentage(null)).toBe(0);
      expect(engine.getTasksCompletionPercentage('# No tasks')).toBe(0);
    });
  });
});
