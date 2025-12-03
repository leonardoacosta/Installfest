import express, { Request, Response } from 'express';
import sqlite3 from 'sqlite3';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import http from 'http';

// Configuration
const PORT = parseInt(process.env.PORT || '3001');
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../db/claude.db');
const PROJECTS_DIR = process.env.PROJECTS_DIR || '/home/leo/dev/projects';
const WEB_DIR = process.env.WEB_DIR || path.join(__dirname, '../web/dist');

// Initialize Express
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

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

// Promisify database methods
const dbGet = (sql: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbRun = (sql: string, params: any[] = []): Promise<sqlite3.RunResult> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

// ============= Project Management =============

// GET /api/projects - List all projects
app.get('/api/projects', async (req: Request, res: Response) => {
  try {
    const projects = await dbAll(
      `SELECT p.*, COUNT(DISTINCT s.id) as session_count,
       MAX(s.started_at) as last_activity
       FROM projects p
       LEFT JOIN sessions s ON p.id = s.project_id
       GROUP BY p.id
       ORDER BY p.updated_at DESC`
    );
    res.json(projects);
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/projects/:id - Get single project
app.get('/api/projects/:id', async (req: Request, res: Response) => {
  try {
    const project = await dbGet('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error: any) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/projects - Create new project
app.post('/api/projects', async (req: Request, res: Response) => {
  const { name, path: projectPath, description } = req.body;

  if (!name || !projectPath) {
    return res.status(400).json({ error: 'Name and path are required' });
  }

  try {
    const result = await dbRun(
      'INSERT INTO projects (name, path, description) VALUES (?, ?, ?)',
      [name, projectPath, description || '']
    );
    res.json({ id: result.lastID, name, path: projectPath, description });
  } catch (error: any) {
    console.error('Error creating project:', error);
    if (error.message.includes('UNIQUE')) {
      res.status(409).json({ error: 'Project with this name already exists' });
    } else {
      res.status(500).json({ error: 'Database error' });
    }
  }
});

// DELETE /api/projects/:id - Delete project
app.delete('/api/projects/:id', async (req: Request, res: Response) => {
  try {
    await dbRun('DELETE FROM projects WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============= Session Management =============

// GET /api/sessions - List all sessions
app.get('/api/sessions', async (req: Request, res: Response) => {
  const { project_id, status } = req.query;

  try {
    let sql = `
      SELECT s.*, p.name as project_name, p.path as project_path
      FROM sessions s
      JOIN projects p ON s.project_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (project_id) {
      sql += ' AND s.project_id = ?';
      params.push(project_id);
    }

    if (status) {
      sql += ' AND s.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY s.started_at DESC';

    const sessions = await dbAll(sql, params);
    res.json(sessions);
  } catch (error: any) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/sessions - Create new agent session
app.post('/api/sessions', async (req: Request, res: Response) => {
  const { project_id } = req.body;

  if (!project_id) {
    return res.status(400).json({ error: 'Project ID is required' });
  }

  try {
    // Get project details
    const project = await dbGet('SELECT * FROM projects WHERE id = ?', [project_id]);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Generate agent ID
    const agentId = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create session
    const result = await dbRun(
      'INSERT INTO sessions (project_id, agent_id, status) VALUES (?, ?, ?)',
      [project_id, agentId, 'running']
    );

    // TODO: Actually spawn Claude agent instance here
    // For now, this is a placeholder that creates the session record

    res.json({
      id: result.lastID,
      project_id,
      agent_id: agentId,
      status: 'running',
      message: 'Agent session created (SDK integration pending)'
    });
  } catch (error: any) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// DELETE /api/sessions/:id - Stop agent session
app.delete('/api/sessions/:id', async (req: Request, res: Response) => {
  try {
    await dbRun(
      'UPDATE sessions SET status = ?, stopped_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['stopped', req.params.id]
    );

    // TODO: Actually stop the Claude agent instance

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error stopping session:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============= Hook Management =============

// GET /api/hooks - Query hooks
app.get('/api/hooks', async (req: Request, res: Response) => {
  const { session_id, tool_name, hook_type, from, to, limit = 100 } = req.query;

  try {
    let sql = 'SELECT * FROM hooks WHERE 1=1';
    const params: any[] = [];

    if (session_id) {
      sql += ' AND session_id = ?';
      params.push(session_id);
    }

    if (tool_name) {
      sql += ' AND tool_name = ?';
      params.push(tool_name);
    }

    if (hook_type) {
      sql += ' AND hook_type = ?';
      params.push(hook_type);
    }

    if (from) {
      sql += ' AND timestamp >= ?';
      params.push(from);
    }

    if (to) {
      sql += ' AND timestamp <= ?';
      params.push(to);
    }

    sql += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(parseInt(limit as string));

    const hooks = await dbAll(sql, params);
    res.json(hooks);
  } catch (error: any) {
    console.error('Error fetching hooks:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/hooks/stats - Hook statistics
app.get('/api/hooks/stats', async (req: Request, res: Response) => {
  const { session_id } = req.query;

  try {
    let sql = `
      SELECT
        hook_type,
        COUNT(*) as count,
        AVG(duration_ms) as avg_duration,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as success_count
      FROM hooks
      WHERE 1=1
    `;
    const params: any[] = [];

    if (session_id) {
      sql += ' AND session_id = ?';
      params.push(session_id);
    }

    sql += ' GROUP BY hook_type';

    const stats = await dbAll(sql, params);
    res.json(stats);
  } catch (error: any) {
    console.error('Error fetching hook stats:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============= WebSocket for Log Streaming =============

wss.on('connection', (ws: WebSocket) => {
  console.log('WebSocket client connected');

  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('WebSocket message:', data);

      // Handle subscription to agent logs
      if (data.type === 'subscribe' && data.sessionId) {
        // TODO: Subscribe to actual agent logs
        ws.send(JSON.stringify({
          type: 'log',
          sessionId: data.sessionId,
          message: 'Connected to agent logs (SDK integration pending)'
        }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend
app.use(express.static(WEB_DIR));

// Fallback to index.html
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(WEB_DIR, 'index.html'));
});

// Start server
server.listen(PORT, () => {
  console.log(`Claude Agent Server running on port ${PORT}`);
  console.log(`Projects directory: ${PROJECTS_DIR}`);
  console.log(`Database: ${DB_PATH}`);
  console.log(`WebSocket server ready`);
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
