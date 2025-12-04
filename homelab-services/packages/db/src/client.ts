import Database from 'better-sqlite3';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

let dbInstance: BetterSQLite3Database<typeof schema> | null = null;
let sqliteInstance: Database.Database | null = null;

export function createDb(dbPath: string): BetterSQLite3Database<typeof schema> {
  if (dbInstance) {
    return dbInstance;
  }

  // Ensure directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  sqliteInstance = sqlite;
  dbInstance = drizzle(sqlite, { schema });

  // Run migrations on first connection
  try {
    const migrationsFolder = path.join(__dirname, '../migrations');
    if (fs.existsSync(migrationsFolder)) {
      console.log('[DB] Running migrations from:', migrationsFolder);
      migrate(dbInstance, { migrationsFolder });
      console.log('[DB] Migrations complete');
    }
  } catch (error) {
    console.error('[DB] Migration error:', error);
    // Don't fail - database might already be migrated
  }

  return dbInstance;
}

export function getDb(): BetterSQLite3Database<typeof schema> {
  if (!dbInstance) {
    // Auto-initialize with default path
    const defaultPath = process.env.DB_PATH || './db/claude.db';
    return createDb(defaultPath);
  }
  return dbInstance;
}

/**
 * Get the underlying SQLite instance for raw SQL queries.
 * Use this when you need to execute raw SQL instead of using Drizzle ORM.
 */
export function getSqlite(): Database.Database {
  if (!sqliteInstance) {
    // Trigger auto-initialization
    getDb();
  }
  return sqliteInstance!;
}

export type Db = BetterSQLite3Database<typeof schema>;
