import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { createContext } from './trpc/context';
import { appRouter } from './trpc/router';
import { createDb } from '@homelab/db';
import path from 'path';

// Configuration
const PORT = parseInt(process.env.PORT || '3001');
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../db/claude.db');
const WEB_DIR = process.env.WEB_DIR || path.join(__dirname, '../../web/dist');

// Initialize database
console.log('Initializing database at:', DB_PATH);
createDb(DB_PATH);
console.log('Database initialized');

// Create Hono app
const app = new Hono();

// Request logging middleware
app.use('*', logger());

// CORS middleware
app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// tRPC endpoint
app.use('/trpc/*', async (c) => {
  return fetchRequestHandler({
    endpoint: '/trpc',
    req: c.req.raw,
    router: appRouter,
    createContext: () => createContext({
      req: c.req.raw as any,
      res: undefined as any,
    }),
  });
});

// Serve static files (frontend)
// Note: In production, Hono's static middleware should be used
// For now, this is a placeholder - we'll handle it properly during deployment

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

// Start server
console.log(`Starting server on port ${PORT}...`);
serve({
  fetch: app.fetch,
  port: PORT,
}, (info) => {
  console.log(`✓ Server running on http://localhost:${info.port}`);
  console.log(`✓ tRPC endpoint: http://localhost:${info.port}/trpc`);
  console.log(`✓ Health check: http://localhost:${info.port}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  process.exit(0);
});
