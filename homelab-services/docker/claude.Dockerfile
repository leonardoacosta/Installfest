# Multi-stage build for Claude Agent Web (Next.js)
FROM oven/bun:1.0-alpine AS base

# Install dependencies stage
FROM base AS deps
WORKDIR /app

# Copy workspace files
COPY package.json bun.lockb* ./
COPY turbo.json ./

# Copy package files for all workspace packages
COPY packages/db/package.json ./packages/db/
COPY packages/validators/package.json ./packages/validators/
COPY packages/ui/package.json ./packages/ui/
COPY packages/api/package.json ./packages/api/
COPY packages/types/package.json* ./packages/types/
COPY apps/claude-agent-web/package.json ./apps/claude-agent-web/

# Install dependencies
RUN bun install --frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app

# Copy node_modules from deps
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps ./apps

# Copy all source code
COPY . .

# Generate Drizzle migrations and build
WORKDIR /app/packages/db
RUN bun run db:generate || true

WORKDIR /app
# Build the Next.js application
RUN bun run build --filter=claude-agent-web

# Production stage - Use Node.js for Next.js
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Create necessary directories
RUN mkdir -p /app/db && chown -R nextjs:nodejs /app/db

# Copy built Next.js app
COPY --from=builder --chown=nextjs:nodejs /app/apps/claude-agent-web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/claude-agent-web/.next/static ./apps/claude-agent-web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/claude-agent-web/public ./apps/claude-agent-web/public

# Copy database package for migrations
COPY --from=builder --chown=nextjs:nodejs /app/packages/db ./packages/db

# Set user
USER nextjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Start Next.js server
CMD ["node", "apps/claude-agent-web/server.js"]
