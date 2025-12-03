import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// Enable CORS
app.use('/*', cors());

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'playwright-server' });
});

// API routes placeholder
app.get('/api/reports', (c) => {
  return c.json({ reports: [] });
});

app.get('/api/workflows', (c) => {
  return c.json({ workflows: [] });
});

const port = Number(process.env.PORT) || 3000;

console.log(`🎭 Playwright Server running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
