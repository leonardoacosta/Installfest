const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const chokidar = require('chokidar');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const cheerio = require('cheerio');

// Configuration
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../db/reports.db');
const REPORTS_DIR = process.env.REPORTS_DIR || '/reports';
const WEB_DIR = process.env.WEB_DIR || path.join(__dirname, '../web/dist');

// Initialize Express
const app = express();
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Initialize Database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database at:', DB_PATH);
});

// Utility: Parse Playwright HTML report
function parsePlaywrightReport(htmlPath) {
  try {
    const html = fs.readFileSync(htmlPath, 'utf8');
    const $ = cheerio.load(html);

    // Extract metadata from HTML
    // Playwright reports embed test data in the HTML
    const scriptTags = $('script').toArray();
    let testData = null;

    for (const script of scriptTags) {
      const content = $(script).html();
      if (content && content.includes('__playwright')) {
        // Try to extract test data
        try {
          const match = content.match(/window\.__playwright\s*=\s*(\{.*?\});/s);
          if (match) {
            testData = JSON.parse(match[1]);
            break;
          }
        } catch (e) {
          // Continue searching
        }
      }
    }

    // Fallback: parse from HTML structure if data extraction fails
    const stats = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0
    };

    // Try to extract from summary text
    const summaryText = $('.suites-header, .summary, [class*="summary"]').text();
    if (summaryText) {
      const totalMatch = summaryText.match(/(\d+)\s+tests?/i);
      const passedMatch = summaryText.match(/(\d+)\s+passed/i);
      const failedMatch = summaryText.match(/(\d+)\s+failed/i);
      const skippedMatch = summaryText.match(/(\d+)\s+skipped/i);

      if (totalMatch) stats.total = parseInt(totalMatch[1]);
      if (passedMatch) stats.passed = parseInt(passedMatch[1]);
      if (failedMatch) stats.failed = parseInt(failedMatch[1]);
      if (skippedMatch) stats.skipped = parseInt(skippedMatch[1]);
    }

    // If we still don't have totals, count test elements
    if (stats.total === 0) {
      stats.total = $('.test, [class*="test-"]').length || 0;
      stats.passed = $('.test.passed, [class*="passed"]').length || 0;
      stats.failed = $('.test.failed, [class*="failed"]').length || 0;
      stats.skipped = $('.test.skipped, [class*="skipped"]').length || 0;
    }

    return stats;
  } catch (error) {
    console.error('Error parsing report:', htmlPath, error.message);
    return { total: 0, passed: 0, failed: 0, skipped: 0, duration: 0 };
  }
}

// File Watcher: Monitor reports directory
function startFileWatcher() {
  console.log('Starting file watcher on:', REPORTS_DIR);

  const watcher = chokidar.watch(REPORTS_DIR, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: false,
    depth: 5
  });

  watcher.on('add', (filePath) => {
    // Only process index.html files (Playwright reports)
    if (path.basename(filePath) === 'index.html') {
      console.log('New report detected:', filePath);
      indexReport(filePath);
    }
  });

  watcher.on('error', (error) => {
    console.error('File watcher error:', error);
  });

  console.log('File watcher started');
}

// Index a report into the database
function indexReport(htmlPath) {
  try {
    const relativePath = path.relative(REPORTS_DIR, htmlPath);
    const pathParts = relativePath.split(path.sep);

    // Expected structure: /reports/{workflow}/{run_id}/index.html
    if (pathParts.length < 3) {
      console.warn('Unexpected path structure:', relativePath);
      return;
    }

    const workflow = pathParts[0];
    const runId = pathParts[1];

    // Parse report HTML
    const stats = parsePlaywrightReport(htmlPath);

    // Insert into database
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO reports
      (workflow, run_id, total_tests, passed, failed, skipped, duration_ms, report_path)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      workflow,
      runId,
      stats.total,
      stats.passed,
      stats.failed,
      stats.skipped,
      stats.duration,
      relativePath,
      (err) => {
        if (err) {
          console.error('Error indexing report:', err.message);
        } else {
          console.log('Report indexed:', workflow, runId);
        }
      }
    );

    stmt.finalize();
  } catch (error) {
    console.error('Error in indexReport:', error.message);
  }
}

// API Routes

// GET /api/reports - List all reports with optional filtering
app.get('/api/reports', (req, res) => {
  const { workflow, from, to, limit = 100, offset = 0 } = req.query;

  let sql = 'SELECT * FROM reports WHERE 1=1';
  const params = [];

  if (workflow) {
    sql += ' AND workflow = ?';
    params.push(workflow);
  }

  if (from) {
    sql += ' AND timestamp >= ?';
    params.push(from);
  }

  if (to) {
    sql += ' AND timestamp <= ?';
    params.push(to);
  }

  sql += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// GET /api/reports/:id - Get single report metadata
app.get('/api/reports/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM reports WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json(row);
  });
});

// GET /api/workflows - List unique workflows
app.get('/api/workflows', (req, res) => {
  db.all('SELECT DISTINCT workflow FROM reports ORDER BY workflow', (err, rows) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows.map(r => r.workflow));
  });
});

// DELETE /api/reports/:id - Delete a report
app.delete('/api/reports/:id', (req, res) => {
  const { id } = req.params;

  // Get report path first
  db.get('SELECT report_path FROM reports WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Delete from database
    db.run('DELETE FROM reports WHERE id = ?', [id], (err) => {
      if (err) {
        console.error('Database error:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }

      // Delete files (optional - may want to keep files)
      const fullPath = path.join(REPORTS_DIR, row.report_path);
      const reportDir = path.dirname(fullPath);

      try {
        fs.rmSync(reportDir, { recursive: true, force: true });
        console.log('Deleted report files:', reportDir);
      } catch (fileErr) {
        console.warn('Could not delete report files:', fileErr.message);
      }

      res.json({ success: true });
    });
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static report files
app.use('/reports-static', express.static(REPORTS_DIR));

// Serve frontend (React app)
app.use(express.static(WEB_DIR));

// Fallback to index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(WEB_DIR, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Playwright Report Server running on port ${PORT}`);
  console.log(`Reports directory: ${REPORTS_DIR}`);
  console.log(`Database: ${DB_PATH}`);

  // Start file watcher
  if (fs.existsSync(REPORTS_DIR)) {
    startFileWatcher();
  } else {
    console.warn(`Reports directory does not exist: ${REPORTS_DIR}`);
    console.warn('File watcher will not start. Create the directory and restart.');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing database...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    }
    process.exit(0);
  });
});
