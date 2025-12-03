import Database from 'better-sqlite3';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

let dbInstance: BetterSQLite3Database<typeof schema> | null = null;
let sqliteInstance: Database.Database | null = null;

export function createDb(dbPath: string): BetterSQLite3Database<typeof schema> {
  if (dbInstance) {
    return dbInstance;
  }

  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  sqliteInstance = sqlite;
  dbInstance = drizzle(sqlite, { schema });
  return dbInstance;
}

export function getDb(): BetterSQLite3Database<typeof schema> {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call createDb() first.');
  }
  return dbInstance;
}

/**
 * Get the underlying SQLite instance for raw SQL queries.
 * Use this when you need to execute raw SQL instead of using Drizzle ORM.
 */
export function getSqlite(): Database.Database {
  if (!sqliteInstance) {
    throw new Error('Database not initialized. Call createDb() first.');
  }
  return sqliteInstance;
}

export type Db = BetterSQLite3Database<typeof schema>;
