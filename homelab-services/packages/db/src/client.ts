import Database from 'better-sqlite3';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

let dbInstance: BetterSQLite3Database<typeof schema> | null = null;

export function createDb(dbPath: string): BetterSQLite3Database<typeof schema> {
  if (dbInstance) {
    return dbInstance;
  }

  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  dbInstance = drizzle(sqlite, { schema });
  return dbInstance;
}

export function getDb(): BetterSQLite3Database<typeof schema> {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call createDb() first.');
  }
  return dbInstance;
}

export type Db = BetterSQLite3Database<typeof schema>;
