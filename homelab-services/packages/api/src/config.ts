/**
 * API Configuration
 *
 * Centralized configuration from environment variables.
 */

export const config = {
  db: {
    path: process.env.DB_PATH || './db/claude.db',
  },
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['*'],
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  projects: {
    dir: process.env.PROJECTS_DIR || '/projects',
  },
} as const

export type Config = typeof config
