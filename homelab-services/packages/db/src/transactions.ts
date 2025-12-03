import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

/**
 * Execute a function within a transaction
 * Automatically rolls back on error
 */
export async function withTransaction<T, TSchema extends Record<string, unknown>>(
  db: BetterSQLite3Database<TSchema>,
  fn: (tx: BetterSQLite3Database<TSchema>) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    return await fn(tx);
  });
}

/**
 * Execute multiple operations in a transaction
 * Returns array of results
 */
export async function batchTransaction<T, TSchema extends Record<string, unknown>>(
  db: BetterSQLite3Database<TSchema>,
  operations: Array<(tx: BetterSQLite3Database<TSchema>) => Promise<T>>
): Promise<T[]> {
  return db.transaction(async (tx) => {
    const results: T[] = [];
    for (const operation of operations) {
      const result = await operation(tx);
      results.push(result);
    }
    return results;
  });
}

/**
 * Retry a transaction on failure
 */
export async function retryTransaction<T, TSchema extends Record<string, unknown>>(
  db: BetterSQLite3Database<TSchema>,
  fn: (tx: BetterSQLite3Database<TSchema>) => Promise<T>,
  maxRetries = 3,
  delayMs = 100
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await withTransaction(db, fn);
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('Transaction failed after retries');
}
