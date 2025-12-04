import { eq, desc } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { sessions, hooks } from '@homelab/db';

export type ActivityStatus = 'running' | 'idle' | 'stopped';

/**
 * Session Activity Monitoring Service
 * Tracks session activity based on hook events
 */
export class SessionMonitorService {
  // Thresholds in milliseconds
  private static readonly IDLE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
  private static readonly ENDED_THRESHOLD = 30 * 60 * 1000; // 30 minutes

  constructor(private db: LibSQLDatabase<any>) {}

  /**
   * Get the latest activity timestamp for a session
   */
  async getSessionActivity(sessionId: number): Promise<Date | null> {
    const latestHook = await this.db
      .select({ timestamp: hooks.timestamp })
      .from(hooks)
      .where(eq(hooks.sessionId, sessionId))
      .orderBy(desc(hooks.timestamp))
      .limit(1)
      .get();

    return latestHook?.timestamp || null;
  }

  /**
   * Check if a session is active (within threshold)
   */
  async isSessionActive(
    sessionId: number,
    thresholdMs: number = SessionMonitorService.IDLE_THRESHOLD
  ): Promise<boolean> {
    const session = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .get();

    if (!session || !session.lastActivityAt) {
      return false;
    }

    const now = Date.now();
    const lastActivity = new Date(session.lastActivityAt).getTime();
    return now - lastActivity < thresholdMs;
  }

  /**
   * Check if a session should be considered ended
   */
  async isSessionEnded(
    sessionId: number,
    thresholdMs: number = SessionMonitorService.ENDED_THRESHOLD
  ): Promise<boolean> {
    const session = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .get();

    if (!session) {
      return true;
    }

    if (session.status === 'stopped' || session.status === 'error') {
      return true;
    }

    if (!session.lastActivityAt) {
      return false;
    }

    const now = Date.now();
    const lastActivity = new Date(session.lastActivityAt).getTime();
    return now - lastActivity >= thresholdMs;
  }

  /**
   * Update session activity timestamp
   */
  async updateSessionActivity(sessionId: number): Promise<void> {
    await this.db
      .update(sessions)
      .set({ lastActivityAt: new Date() })
      .where(eq(sessions.id, sessionId));
  }

  /**
   * Calculate activity status for a session
   */
  async calculateActivityStatus(sessionId: number): Promise<ActivityStatus> {
    const session = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .get();

    if (!session) {
      return 'stopped';
    }

    // Check explicit status first
    if (session.status === 'stopped' || session.status === 'error') {
      return 'stopped';
    }

    // No activity recorded yet
    if (!session.lastActivityAt) {
      return session.status === 'running' ? 'running' : 'stopped';
    }

    const now = Date.now();
    const lastActivity = new Date(session.lastActivityAt).getTime();
    const timeSinceActivity = now - lastActivity;

    // Determine status based on time since last activity
    if (timeSinceActivity >= SessionMonitorService.ENDED_THRESHOLD) {
      return 'stopped';
    } else if (timeSinceActivity >= SessionMonitorService.IDLE_THRESHOLD) {
      return 'idle';
    } else {
      return 'running';
    }
  }

  /**
   * Get activity status for multiple sessions
   */
  async getSessionStatuses(
    sessionIds: number[]
  ): Promise<Map<number, ActivityStatus>> {
    const statusMap = new Map<number, ActivityStatus>();

    await Promise.all(
      sessionIds.map(async (sessionId) => {
        const status = await this.calculateActivityStatus(sessionId);
        statusMap.set(sessionId, status);
      })
    );

    return statusMap;
  }

  /**
   * Auto-close sessions that have been idle for too long
   */
  async autoCloseIdleSessions(): Promise<number[]> {
    const allSessions = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.status, 'running'))
      .all();

    const sessionsToClose: number[] = [];

    for (const session of allSessions) {
      const isEnded = await this.isSessionEnded(session.id);
      if (isEnded) {
        await this.db
          .update(sessions)
          .set({
            status: 'stopped',
            stoppedAt: new Date(),
          })
          .where(eq(sessions.id, session.id));

        sessionsToClose.push(session.id);
      }
    }

    return sessionsToClose;
  }
}
