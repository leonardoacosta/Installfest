# Multi-stage build for Claude Agent Server
FROM oven/bun:1.0-alpine AS base

# Install dependencies stage
FROM base AS deps
WORKDIR /app

# Copy workspace files
COPY package.json bun.lock ./
COPY turbo.json ./

# Copy package files
COPY packages/db/package.json ./packages/db/
COPY packages/validators/package.json ./packages/validators/
COPY packages/ui/package.json ./packages/ui/
COPY apps/claude-agent/package.json ./apps/claude-agent/

# Install dependencies
RUN bun install --frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps ./apps

# Copy source code
COPY tsconfig.json ./
COPY turbo.json ./
COPY packages/ ./packages/
COPY apps/claude-agent/ ./apps/claude-agent/

# Build the application
RUN bun run build --filter=@homelab/claude-agent

# Production stage
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy built artifacts
COPY --from=builder --chown=nodejs:nodejs /app/apps/claude-agent/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/db/dist ./packages/db/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/validators/dist ./packages/validators/dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Set user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]
