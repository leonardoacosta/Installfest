# Otaku Odyssey - Convention Management System

## Project Overview

Otaku Odyssey is a comprehensive convention management system for anime/gaming conventions. It handles attendee registration, vendor management, sponsorship coordination, hotel partnerships, panel scheduling, and role-based access control.

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **API**: tRPC v11 with superjson transformer
- **Database**: PostgreSQL via Neon, Drizzle ORM
- **Auth**: Better Auth
- **Validation**: Zod
- **UI**: React 18, shadcn/ui, Tailwind CSS
- **Forms**: react-hook-form with @hookform/resolvers/zod
- **Testing**: Vitest
- **Background Jobs**: Inngest
- **Caching**: Upstash Redis
- **Payments**: Stripe
- **File Storage**: Vercel Blob

## Critical Conventions

### Database Schemas (Drizzle)

```typescript
// Always use these patterns:
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// Table naming: plural, snake_case
export const sponsors = pgTable("sponsors", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  // Always include these audit fields:
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations in separate declaration
export const sponsorsRelations = relations(sponsors, ({ one, many }) => ({
  convention: one(conventions, {
    fields: [sponsors.conventionId],
    references: [conventions.id],
  }),
}));
```

IMPORTANT: Export all schemas from `src/db/schema/index.ts`

### tRPC Routers

```typescript
// Always use these patterns:
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { z } from "zod";

export const sponsorsRouter = createTRPCRouter({
  // Queries use publicProcedure or protectedProcedure based on auth needs
  list: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ ctx, input }) => {
      // Always use ctx.db for database access
      // Always use ctx.session for auth info
    }),

  // Mutations always use protectedProcedure
  create: protectedProcedure
    .input(createSponsorSchema)
    .mutation(async ({ ctx, input }) => {
      // Return the created entity
    }),
});
```

IMPORTANT: Export all routers from `src/server/api/root.ts`

### Zod Validations

```typescript
// Always create separate schemas for create/update
export const createSponsorSchema = z.object({
  name: z.string().min(1).max(255),
  // Use .optional() for update schemas
});

export const updateSponsorSchema = createSponsorSchema.partial();

// Infer types from schemas
export type CreateSponsorInput = z.infer<typeof createSponsorSchema>;
```

### React Components

```typescript
// Use shadcn/ui components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Forms use react-hook-form with zodResolver
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export function SponsorForm() {
  const form = useForm<CreateSponsorInput>({
    resolver: zodResolver(createSponsorSchema),
  });
}
```

### File Organization

```
src/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/        # Authenticated routes
│   │   └── [feature]/      # Feature pages
│   └── (public)/           # Public routes
├── components/
│   ├── ui/                 # shadcn/ui components
│   └── [feature]/          # Feature-specific components
├── db/
│   └── schema/             # Drizzle schemas
├── lib/
│   ├── validations/        # Zod schemas
│   └── utils/              # Utility functions
├── server/
│   └── api/
│       ├── routers/        # tRPC routers
│       ├── root.ts         # Router exports
│       └── trpc.ts         # tRPC setup
└── types/                  # TypeScript interfaces
```

## Build Commands

- `pnpm dev` - Start development server
- `pnpm build` - Production build
- `pnpm test` - Run Vitest tests
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - TypeScript check (`tsc --noEmit`)
- `pnpm db:generate` - Generate Drizzle migrations
- `pnpm db:migrate` - Run migrations
- `pnpm db:studio` - Open Drizzle Studio

## Workflow Integration

### OpenSpec Commands
- `/openspec:proposal [desc]` - Create new feature spec
- `/apply-batch [name]` - Apply spec with parallel execution
- `/archive [name]` - Archive completed spec

### Context Management
- `/store-context [name]` - Save context before /clear
- `/resume [name]` - Resume from stored context
- `/recall [name]` - View learnings from past specs

## Domain Context

### Applicant Types
The system handles multiple applicant workflows:
- **Attendees**: Badge registration and check-in
- **Vendors**: Booth applications and assignments
- **Sponsors**: Tiered sponsorship packages ($250-$3000)
- **Panelists**: Panel proposals and scheduling
- **Volunteers**: Shift management and assignments

### Common Patterns
All applicant types follow: Application → Review → Approval → Payment workflow

### Current Features in Development
- Sponsorship tier system with benefit bundles
- Hotel partnership management
- RBAC permissions system

## Quality Gates

IMPORTANT: Before any PR or archive:
1. `pnpm typecheck` must pass
2. `pnpm build` must succeed
3. `pnpm test` must pass
4. `pnpm lint` must have no errors

## AI Agent Instructions

When implementing features:
1. Always read the relevant skill files first
2. Follow the parallel group pattern in tasks.md
3. Validate after each phase with `pnpm build`
4. Update tasks.md as you complete items
5. Use conventional commits: `feat:`, `fix:`, `chore:`
