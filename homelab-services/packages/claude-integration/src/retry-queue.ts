/**
 * Retry Queue
 *
 * Handles failed notifications with exponential backoff.
 */

export interface RetryQueueItem<T> {
  id: string;
  payload: T;
  attempts: number;
  maxAttempts: number;
  nextRetryAt: number;
  error?: string;
}

export class RetryQueue<T> {
  private queue: Map<string, RetryQueueItem<T>> = new Map();
  private processing = false;
  private maxAttempts: number;
  private baseDelayMs: number;

  constructor(maxAttempts = 3, baseDelayMs = 1000) {
    this.maxAttempts = maxAttempts;
    this.baseDelayMs = baseDelayMs;
  }

  /**
   * Add item to retry queue
   */
  add(id: string, payload: T, error?: string): void {
    const existing = this.queue.get(id);

    if (existing) {
      // Increment attempts and update retry time
      const attempts = existing.attempts + 1;
      const nextRetryAt = Date.now() + this.calculateDelay(attempts);

      this.queue.set(id, {
        ...existing,
        attempts,
        nextRetryAt,
        error,
      });
    } else {
      // First retry attempt
      const nextRetryAt = Date.now() + this.baseDelayMs;

      this.queue.set(id, {
        id,
        payload,
        attempts: 1,
        maxAttempts: this.maxAttempts,
        nextRetryAt,
        error,
      });
    }
  }

  /**
   * Get items ready for retry
   */
  getReady(): RetryQueueItem<T>[] {
    const now = Date.now();
    const ready: RetryQueueItem<T>[] = [];

    for (const item of this.queue.values()) {
      if (item.nextRetryAt <= now && item.attempts < item.maxAttempts) {
        ready.push(item);
      }
    }

    return ready;
  }

  /**
   * Remove item from queue
   */
  remove(id: string): void {
    this.queue.delete(id);
  }

  /**
   * Get item by ID
   */
  get(id: string): RetryQueueItem<T> | undefined {
    return this.queue.get(id);
  }

  /**
   * Get all items
   */
  getAll(): RetryQueueItem<T>[] {
    return Array.from(this.queue.values());
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateDelay(attempts: number): number {
    return this.baseDelayMs * Math.pow(2, attempts - 1);
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    total: number;
    ready: number;
    maxedOut: number;
  } {
    const now = Date.now();
    let ready = 0;
    let maxedOut = 0;

    for (const item of this.queue.values()) {
      if (item.attempts >= item.maxAttempts) {
        maxedOut++;
      } else if (item.nextRetryAt <= now) {
        ready++;
      }
    }

    return {
      total: this.queue.size,
      ready,
      maxedOut,
    };
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue.clear();
  }
}
