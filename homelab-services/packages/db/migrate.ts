import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../db/claude.db');

console.log('Running migrations...');
console.log('Database path:', dbPath);

const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

migrate(db, { migrationsFolder: './migrations' });

console.log('Migrations complete!');
sqlite.close();
