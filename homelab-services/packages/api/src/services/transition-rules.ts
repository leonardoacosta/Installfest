import { type SpecStatus } from '@homelab/validators';
import { db, openspecSpecs } from '@homelab/db';
import { eq } from 'drizzle-orm';

/**
 * State machine graph defining allowed transitions between spec states
 */
const allowedTransitions: Record<SpecStatus, SpecStatus[]> = {
  proposing: ['approved', 'proposing'], // Can reject back to proposing
  approved: ['assigned', 'proposing'], // Can revert to proposing
  assigned: ['in_progress', 'proposing'],
  in_progress: ['review', 'proposing'],
  review: ['applied', 'in_progress'], // Can send back for more work
  applied: ['archived'],
  archived: [], // Terminal state
};

/**
 * TransitionRulesEngine validates state transitions and detects automatic transition triggers
 */
export class TransitionRulesEngine {
  /**
   * Validate if a state transition is allowed
   */
  validateTransition(from: SpecStatus, to: SpecStatus): boolean {
    return allowedTransitions[from].includes(to);
  }

  /**
   * Get all possible next states from current state
   */
  getNextStates(currentState: SpecStatus): SpecStatus[] {
    return allowedTransitions[currentState];
  }

  /**
   * Check if transition requires manual user approval
   */
  isManualGate(from: SpecStatus, to: SpecStatus): boolean {
    return (
      (from === 'proposing' && to === 'approved') ||
      (from === 'review' && to === 'applied')
    );
  }

  /**
   * Parse tasks.md content and check if all tasks are complete
   */
  checkTasksComplete(tasksContent: string | null): boolean {
    if (!tasksContent) return false;

    const lines = tasksContent.split('\n');
    const taskLines = lines.filter(line => /^- \[[x ]\]/.test(line.trim()));

    if (taskLines.length === 0) return false; // No tasks

    const completedTasks = taskLines.filter(line => /^- \[x\]/.test(line.trim()));

    // All tasks complete if every task line has [x]
    return completedTasks.length === taskLines.length;
  }

  /**
   * Calculate completion percentage for tasks
   */
  getTasksCompletionPercentage(tasksContent: string | null): number {
    if (!tasksContent) return 0;

    const lines = tasksContent.split('\n');
    const taskLines = lines.filter(line => /^- \[[x ]\]/.test(line.trim()));

    if (taskLines.length === 0) return 0;

    const completedTasks = taskLines.filter(line => /^- \[x\]/.test(line.trim()));

    return Math.round((completedTasks.length / taskLines.length) * 100);
  }

  /**
   * Check if spec should auto-transition based on current state and conditions
   * Returns next state if criteria met, null otherwise
   */
  async shouldAutoTransition(specId: string): Promise<SpecStatus | null> {
    const spec = await db.query.openspecSpecs.findFirst({
      where: eq(openspecSpecs.id, specId),
    });

    if (!spec) return null;

    // in_progress → review: when all tasks complete
    if (spec.status === 'in_progress') {
      const tasksComplete = this.checkTasksComplete(spec.tasksContent);
      if (tasksComplete) {
        return 'review';
      }
    }

    // approved → assigned: when worker picks up (handled externally)
    // assigned → in_progress: when worker starts (handled externally)
    // Other transitions are manual

    return null;
  }

  /**
   * Validate that a spec can transition to a given state
   */
  async canTransition(specId: string, toState: SpecStatus): Promise<{
    allowed: boolean;
    reason?: string;
    currentState?: SpecStatus;
  }> {
    const spec = await db.query.openspecSpecs.findFirst({
      where: eq(openspecSpecs.id, specId),
    });

    if (!spec) {
      return {
        allowed: false,
        reason: `Spec ${specId} not found`,
      };
    }

    const currentState = spec.status as SpecStatus;

    if (!this.validateTransition(currentState, toState)) {
      return {
        allowed: false,
        reason: `Transition from ${currentState} to ${toState} is not allowed`,
        currentState,
      };
    }

    return {
      allowed: true,
      currentState,
    };
  }
}
