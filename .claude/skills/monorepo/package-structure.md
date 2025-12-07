# Monorepo Package Structure Patterns

## Recommended Structure

```
├── apps/
│   ├── web/                 # Next.js web application
│   ├── mobile/              # Expo mobile app
│   └── api/                 # Standalone API server (optional)
├── packages/
│   ├── ui/                  # Shared UI components (ShadCN)
│   ├── db/                  # Drizzle schema and migrations
│   ├── api/                 # tRPC routers and procedures
│   ├── auth/                # Authentication logic
│   ├── validators/          # Shared Zod schemas
│   ├── config/              # Shared configs (eslint, tsconfig)
│   └── utils/               # Shared utilities
├── tooling/
│   ├── eslint/              # ESLint configuration
│   ├── typescript/          # TypeScript base configs
│   └── tailwind/            # Tailwind configuration
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## Package package.json Templates

### Shared UI Package

```json
{
  "name": "@repo/ui",
  "version": "0.0.0",
  "private": true,
  "exports": {
    "./button": "./src/button.tsx",
    "./card": "./src/card.tsx",
    "./form": "./src/form.tsx",
    "./globals.css": "./src/globals.css"
  },
  "scripts": {
    "lint": "eslint src/",
    "typecheck": "tsc --noEmit"
  },
  "peerDependencies": {
    "react": "^18.0.0"
  },
  "devDependencies": {
    "@repo/eslint-config": "workspace:*",
    "@repo/typescript-config": "workspace:*",
    "react": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
```

### Database Package

```json
{
  "name": "@repo/db",
  "version": "0.0.0",
  "private": true,
  "exports": {
    ".": "./src/index.ts",
    "./schema": "./src/schema/index.ts",
    "./client": "./src/client.ts"
  },
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "drizzle-orm": "^0.30.0",
    "postgres": "^3.4.0"
  },
  "devDependencies": {
    "@repo/typescript-config": "workspace:*",
    "drizzle-kit": "^0.21.0",
    "typescript": "^5.0.0"
  }
}
```

### API Package (tRPC)

```json
{
  "name": "@repo/api",
  "version": "0.0.0",
  "private": true,
  "exports": {
    ".": "./src/index.ts",
    "./root": "./src/root.ts",
    "./trpc": "./src/trpc.ts"
  },
  "scripts": {
    "lint": "eslint src/",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@repo/db": "workspace:*",
    "@repo/validators": "workspace:*",
    "@trpc/server": "^11.0.0"
  },
  "devDependencies": {
    "@repo/typescript-config": "workspace:*",
    "typescript": "^5.0.0"
  }
}
```

### Validators Package

```json
{
  "name": "@repo/validators",
  "version": "0.0.0",
  "private": true,
  "exports": {
    ".": "./src/index.ts",
    "./user": "./src/user.ts",
    "./post": "./src/post.ts"
  },
  "dependencies": {
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@repo/typescript-config": "workspace:*",
    "typescript": "^5.0.0"
  }
}
```

## TypeScript Configuration

### Base Config (tooling/typescript/base.json)

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "target": "ES2022",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true
  }
}
```

### Next.js Config (tooling/typescript/nextjs.json)

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "ES2022"],
    "jsx": "preserve",
    "module": "ESNext",
    "plugins": [{ "name": "next" }]
  }
}
```

## ESLint Configuration

### Base Config (tooling/eslint/base.js)

```javascript
/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  rules: {
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/consistent-type-imports": "error",
  },
};
```

## Importing from Packages

### In Next.js App

```typescript
// Import UI components
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";

// Import database
import { db } from "@repo/db";
import { users } from "@repo/db/schema";

// Import tRPC
import { appRouter } from "@repo/api";

// Import validators
import { createUserSchema } from "@repo/validators/user";
```

### In Package

```typescript
// packages/api/src/routers/user.ts
import { db } from "@repo/db";
import { users } from "@repo/db/schema";
import { createUserSchema } from "@repo/validators/user";

export const userRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createUserSchema)
    .mutation(async ({ ctx, input }) => {
      return db.insert(users).values(input).returning();
    }),
});
```

## Dependency Versioning

Use `workspace:*` for internal packages:

```json
{
  "dependencies": {
    "@repo/db": "workspace:*",
    "@repo/ui": "workspace:*",
    "@repo/validators": "workspace:*"
  }
}
```

Use `catalog:` for shared external dependencies (pnpm):

```yaml
# pnpm-workspace.yaml
catalog:
  react: ^18.2.0
  typescript: ^5.3.0
  zod: ^3.22.0
```
