# Multi-stage build for Playwright Report Server (Next.js)
FROM oven/bun:1.0-alpine AS base

# Install dependencies stage
FROM base AS deps
WORKDIR /app

# Copy workspace files
COPY package.json bun.lock ./
COPY turbo.json ./

# Copy all package.json files
COPY packages/db/package.json ./packages/db/
COPY packages/validators/package.json ./packages/validators/
COPY packages/ui/package.json ./packages/ui/
COPY packages/api/package.json ./packages/api/
COPY packages/report-parser/package.json ./packages/report-parser/
COPY packages/failure-classifier/package.json ./packages/failure-classifier/
COPY packages/claude-integration/package.json ./packages/claude-integration/
COPY apps/playwright-server/package.json ./apps/playwright-server/

# Install dependencies
RUN bun install --frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json

# Copy source code
COPY tsconfig.json ./
COPY tsconfig.base.json ./
COPY turbo.json ./
COPY packages/ ./packages/
COPY apps/playwright-server/ ./apps/playwright-server/

# Set environment for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build all packages and the Next.js app
RUN bun run build --filter=@homelab/playwright-server

# Production stage
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Set environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Copy Next.js build artifacts
COPY --from=builder --chown=nodejs:nodejs /app/apps/playwright-server/.next/standalone ./
COPY --from=builder --chown=nodejs:nodejs /app/apps/playwright-server/.next/static ./apps/playwright-server/.next/static
COPY --from=builder --chown=nodejs:nodejs /app/apps/playwright-server/public ./apps/playwright-server/public

# Copy package dependencies (for workspace packages)
COPY --from=builder --chown=nodejs:nodejs /app/packages ./packages

# Create reports and db directories
RUN mkdir -p /app/reports /app/db && chown -R nodejs:nodejs /app/reports /app/db

# Set user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the Next.js application
CMD ["node", "apps/playwright-server/server.js"]
