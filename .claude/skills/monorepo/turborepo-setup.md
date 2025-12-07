# Turborepo Setup Patterns

## turbo.json Configuration

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

## Pipeline Dependencies

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "db:generate": {
      "cache": false
    },
    "db:push": {
      "cache": false,
      "dependsOn": ["db:generate"]
    },
    "dev": {
      "dependsOn": ["^db:generate"],
      "cache": false,
      "persistent": true
    }
  }
}
```

## Workspace Root package.json

```json
{
  "name": "monorepo",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "test": "turbo test",
    "clean": "turbo clean && rm -rf node_modules",
    "db:generate": "turbo db:generate",
    "db:push": "turbo db:push",
    "format": "prettier --write \"**/*.{ts,tsx,md}\""
  },
  "devDependencies": {
    "prettier": "^3.0.0",
    "turbo": "^2.0.0",
    "typescript": "^5.0.0"
  },
  "packageManager": "pnpm@9.0.0"
}
```

## pnpm-workspace.yaml

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

## Filtering Commands

```bash
# Build specific package
turbo build --filter=@repo/web

# Build package and its dependencies
turbo build --filter=@repo/web...

# Build dependents of a package
turbo build --filter=...@repo/ui

# Build everything except one package
turbo build --filter=!@repo/docs

# Build changed packages since main
turbo build --filter=[main]

# Run in specific app
turbo dev --filter=web

# Combine filters
turbo build --filter=@repo/web --filter=@repo/api
```

## Environment Variables

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "env": ["DATABASE_URL", "NEXT_PUBLIC_*"],
      "passThroughEnv": ["CI", "VERCEL"]
    }
  },
  "globalEnv": ["GITHUB_TOKEN"],
  "globalPassThroughEnv": ["NODE_ENV"]
}
```

## Remote Caching

```bash
# Login to Vercel
turbo login

# Link to remote cache
turbo link

# Run with remote cache
turbo build --remote-only
```

```json
// turbo.json with team
{
  "$schema": "https://turbo.build/schema.json",
  "remoteCache": {
    "signature": true
  }
}
```

## CI/CD with Turborepo

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - run: pnpm install

      - run: pnpm turbo build lint typecheck test --cache-dir=.turbo
        env:
          TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
          TURBO_TEAM: ${{ secrets.TURBO_TEAM }}
```

## Pruning for Docker

```dockerfile
FROM node:20-alpine AS base
RUN npm install -g pnpm turbo

FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune @repo/web --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .
RUN pnpm turbo build --filter=@repo/web

FROM base AS runner
WORKDIR /app
COPY --from=installer /app/apps/web/.next/standalone ./
COPY --from=installer /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer /app/apps/web/public ./apps/web/public

CMD ["node", "apps/web/server.js"]
```

## Task Graph Visualization

```bash
# Generate task graph
turbo build --graph

# Output to file
turbo build --graph=graph.png

# Dry run to see what would run
turbo build --dry-run

# Show summary
turbo build --summarize
```
