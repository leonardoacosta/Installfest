# Project Name

<!-- Import global standards from centralized config -->
@~/.claude/CLAUDE.md

## Tech Stack

### Shared (Monorepo)
- **Monorepo**: Turborepo + pnpm workspaces
- **API**: tRPC v11+ (shared between web and mobile)
- **Database**: Drizzle ORM + PostgreSQL
- **Validation**: Zod schemas (shared)
- **Auth**: Better-Auth
- **State**: React Query (via tRPC) + Zustand

### Web (Next.js)
- **Framework**: Next.js 14+ (App Router)
- **UI**: ShadCN UI + Tailwind CSS
- **Forms**: react-hook-form + Zod
- **Testing**: Playwright (E2E) + Vitest (unit)

### Mobile (Expo)
- **Framework**: React Native + Expo SDK 50+
- **Navigation**: Expo Router (file-based)
- **Styling**: NativeWind (Tailwind for RN)
- **Storage**: MMKV (sync) + SecureStore (secrets)
- **Build**: EAS Build + EAS Submit

## Build Commands

### Monorepo
- `pnpm dev` - Start all apps in dev mode
- `pnpm build` - Production build all apps
- `pnpm typecheck` - Type checking across workspace
- `pnpm lint` - Lint all packages
- `pnpm test` - Run all tests
- `pnpm db:generate` - Generate Drizzle migrations
- `pnpm db:push` - Push schema to database

### Web-specific
- `pnpm dev --filter=web` - Start web only
- `pnpm test:e2e` - Run Playwright E2E tests

### Mobile-specific
- `pnpm dev --filter=mobile` - Start Expo dev server
- `pnpm ios --filter=mobile` - Run on iOS simulator
- `pnpm android --filter=mobile` - Run on Android emulator
- `pnpm build:preview --filter=mobile` - EAS preview build

## Directory Structure

```
apps/
  web/                    # Next.js app (App Router)
    app/                  # App Router pages
    components/           # Web-specific components
  mobile/                 # Expo app
    app/                  # Expo Router screens
      (tabs)/             # Tab navigation
      (auth)/             # Auth flow
    components/           # Mobile-specific components
packages/
  api/                    # tRPC routers (shared)
  db/                     # Drizzle schema (shared)
  ui/                     # ShadCN components (web)
  app/                    # Shared React Native components
  validators/             # Zod schemas (shared)
  auth/                   # Auth logic (shared)
```

## Conventions

### Shared Code (packages/)

- tRPC routers in `packages/api/` - used by both web and mobile
- Zod schemas in `packages/validators/` - shared validation
- Database schema in `packages/db/` - single source of truth
- Auth logic in `packages/auth/` - shared authentication

### Web (apps/web/)

- Server Components by default, Client only for interactivity
- Forms use react-hook-form + zodResolver
- Use ShadCN UI components from `@repo/ui`
- E2E tests with Playwright for critical flows

### Mobile (apps/mobile/)

- Use Expo Router for file-based navigation
- NativeWind for styling (Tailwind syntax)
- MMKV for sync storage, SecureStore for secrets
- Always request permissions before native features
- Test on physical devices, not just simulators

### API (packages/api/)

- Group procedures by domain: `userRouter`, `postRouter`
- Use `protectedProcedure` for authenticated endpoints
- Input validation with Zod schemas from `@repo/validators`
- Same router works for both web and mobile clients

### Database (packages/db/)

- All tables have `createdAt` and `updatedAt` timestamps
- Foreign keys always indexed
- Multi-tenant tables include `organizationId`
- Use transactions for multi-step operations

## Platform-Specific Patterns

### Shared tRPC Client

```typescript
// Web: apps/web/lib/trpc.ts
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@repo/api";
export const api = createTRPCReact<AppRouter>();

// Mobile: apps/mobile/lib/trpc.ts
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@repo/api";
export const api = createTRPCReact<AppRouter>();
```

### Platform Detection

```typescript
// packages/utils/platform.ts
import { Platform } from "react-native";

export const isWeb = Platform.OS === "web";
export const isIOS = Platform.OS === "ios";
export const isAndroid = Platform.OS === "android";
export const isMobile = isIOS || isAndroid;
```

### Shared Components

```typescript
// packages/app/src/user-avatar.tsx
// Shared component that works on both platforms
import { Image, View } from "react-native";

export function UserAvatar({ url, size = 40 }: Props) {
  return (
    <View className="rounded-full overflow-hidden" style={{ width: size, height: size }}>
      <Image source={{ uri: url }} className="w-full h-full" />
    </View>
  );
}
```
