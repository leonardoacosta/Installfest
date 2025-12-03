const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../db/reports.db');

// Initialize database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database');
});

// Create reports table
const createTable = `
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow TEXT NOT NULL,
    run_id TEXT NOT NULL,
    run_number INTEGER,
    commit_sha TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_tests INTEGER DEFAULT 0,
    passed INTEGER DEFAULT 0,
    failed INTEGER DEFAULT 0,
    skipped INTEGER DEFAULT 0,
    duration_ms INTEGER DEFAULT 0,
    report_path TEXT NOT NULL UNIQUE,
    indexed_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`;

// Create indexes
const createIndexes = [
  'CREATE INDEX IF NOT EXISTS idx_workflow_timestamp ON reports(workflow, timestamp DESC)',
  'CREATE INDEX IF NOT EXISTS idx_run_id ON reports(run_id)',
  'CREATE INDEX IF NOT EXISTS idx_timestamp ON reports(timestamp DESC)'
];

// Execute table creation
db.run(createTable, (err) => {
  if (err) {
    console.error('Error creating table:', err.message);
    process.exit(1);
  }
  console.log('Reports table created successfully');

  // Create indexes
  let completed = 0;
  createIndexes.forEach((indexSQL) => {
    db.run(indexSQL, (err) => {
      if (err) {
        console.error('Error creating index:', err.message);
      }
      completed++;
      if (completed === createIndexes.length) {
        console.log('All indexes created successfully');
        db.close((err) => {
          if (err) {
            console.error('Error closing database:', err.message);
          }
          console.log('Database initialization complete');
          process.exit(0);
        });
      }
    });
  });
});
