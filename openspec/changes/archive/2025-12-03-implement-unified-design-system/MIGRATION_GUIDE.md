# Migration Guide: T3 Stack with Unified Design System

This guide shows you how to migrate a new homelab service to use the T3 Stack pattern with the `@homelab/ui` design system, `@homelab/api` shared tRPC routers, and `@homelab/db` database.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Step 1: Project Setup](#step-1-project-setup)
- [Step 2: tRPC Integration](#step-2-trpc-integration)
- [Step 3: Layout Components](#step-3-layout-components)
- [Step 4: Pages and Features](#step-4-pages-and-features)
- [Step 5: Testing and Build](#step-5-testing-and-build)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- ✅ Phase 1-5 completed (`packages/ui` fully set up)
- ✅ `packages/api` with tRPC routers configured
- ✅ `packages/db` with database schema
- ✅ Bun installed for package management

**Time Estimate**: 2-3 hours for a basic service (following the proven pattern)

---

## Step 1: Project Setup

### 1.1 Create Next.js App Structure

```bash
cd homelab-services/apps
mkdir my-new-service
cd my-new-service

# Create directory structure
mkdir -p src/{app,components,trpc}
mkdir -p src/app/api/trpc/\[trpc\]
mkdir -p src/app/\(dashboard\)
mkdir public
```

### 1.2 Create package.json

```json
{
  "name": "@homelab/my-new-service",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3003",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@homelab/api": "workspace:*",
    "@homelab/db": "workspace:*",
    "@homelab/ui": "workspace:*",
    "@homelab/validators": "workspace:*",
    "@tanstack/react-query": "^5.62.12",
    "@trpc/client": "^11.0.0-rc.364",
    "@trpc/react-query": "^11.0.0-rc.364",
    "@trpc/server": "^11.0.0-rc.364",
    "lucide-react": "^0.555.0",
    "next": "^14.2.18",
    "next-themes": "^0.2.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "superjson": "^2.2.1"
  },
  "devDependencies": {
    "@types/node": "^20.17.6",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.15",
    "typescript": "^5.3.0"
  }
}
```

### 1.3 Create Configuration Files

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**next.config.js**:
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@homelab/ui', '@homelab/api', '@homelab/db'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
```

**tailwind.config.ts**:
```ts
import type { Config } from 'tailwindcss'
import baseConfig from '@homelab/ui/tailwind.config'

export default {
  presets: [baseConfig],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
} satisfies Config
```

**postcss.config.js**:
```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### 1.4 Install Dependencies

```bash
cd ../.. # Back to homelab-services root
bun install
```

---

## Step 2: tRPC Integration

### 2.1 Create tRPC Client

**src/trpc/client.ts**:
```ts
import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '@homelab/api'

export const trpc = createTRPCReact<AppRouter>()
```

### 2.2 Create tRPC Provider

**src/trpc/Provider.tsx**:
```tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { useState } from 'react'
import superjson from 'superjson'
import { trpc } from './client'

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
          transformer: superjson,
        }),
      ],
    })
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}
```

### 2.3 Create API Route Handler

**src/app/api/trpc/[trpc]/route.ts**:
```ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter, createContext } from '@homelab/api'

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
  })

export { handler as GET, handler as POST }
```

---

## Step 3: Layout Components

### 3.1 Create Providers Wrapper

**src/components/Providers.tsx**:
```tsx
'use client'

import { ThemeProvider } from 'next-themes'
import { Toaster } from '@homelab/ui'
import { TRPCProvider } from '@/trpc/Provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TRPCProvider>
        {children}
        <Toaster />
      </TRPCProvider>
    </ThemeProvider>
  )
}
```

### 3.2 Create Global Styles

**src/app/globals.css**:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### 3.3 Create Root Layout

**src/app/layout.tsx**:
```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/Providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'My Service',
  description: 'Service description',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

### 3.4 Create Sidebar Component

**src/components/Sidebar.tsx**:
```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@homelab/ui/lib/utils'
import { Button } from '@homelab/ui/button'
import {
  LayoutDashboard,
  FileText,
  Settings,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Items', href: '/items', icon: FileText },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">My Service</h1>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start',
                  isActive && 'bg-secondary'
                )}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Button>
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-4">
        <Link href="/settings">
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="mr-3 h-5 w-5" />
            Settings
          </Button>
        </Link>
      </div>
    </div>
  )
}
```

### 3.5 Create TopBar Component

**src/components/TopBar.tsx**:
```tsx
'use client'

import { Button } from '@homelab/ui/button'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

export function TopBar() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="flex-1">
        {/* Breadcrumb or page title */}
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </div>
  )
}
```

### 3.6 Create Dashboard Layout

**src/app/(dashboard)/layout.tsx**:
```tsx
import { Sidebar } from '@/components/Sidebar'
import { TopBar } from '@/components/TopBar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
```

---

## Step 4: Pages and Features

### 4.1 Create Home Page (Redirect)

**src/app/page.tsx**:
```tsx
import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/items')
}
```

### 4.2 Create Feature Page Example

**src/app/(dashboard)/items/page.tsx**:
```tsx
'use client'

import { useState } from 'react'
import { trpc } from '@/trpc/client'
import { Button } from '@homelab/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@homelab/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@homelab/ui/table'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from '@homelab/ui/use-toast'

export default function ItemsPage() {
  const utils = trpc.useUtils()
  const { data: items, isLoading } = trpc.items.list.useQuery()

  const deleteItem = trpc.items.delete.useMutation({
    onSuccess: () => {
      utils.items.list.invalidate()
      toast({
        title: 'Item deleted',
        description: 'The item has been deleted successfully.',
      })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Items</h1>
          <p className="text-muted-foreground">
            Manage your items
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Item
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Items</CardTitle>
          <CardDescription>
            {items?.length || 0} item(s) total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading items...
            </div>
          ) : items && items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(items as any[]).map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.name}
                    </TableCell>
                    <TableCell>
                      {new Date(item.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteItem.mutate({ id: item.id })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <h3 className="mt-4 text-lg font-semibold">No items yet</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Get started by creating your first item.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## Step 5: Testing and Build

### 5.1 Type Check

```bash
cd apps/my-new-service
bun run type-check
```

Fix any TypeScript errors by adding type assertions where needed:
```tsx
// Common pattern for tRPC query results
const items = data as MyItemType[] | undefined
```

### 5.2 Build

```bash
bun run build
```

Expected output:
```
Route (app)                   Size     First Load JS
/                            138 B     87.4 kB
/items                       1.85 kB   177 kB
```

### 5.3 Dev Server

```bash
bun run dev
```

Visit `http://localhost:3003` to test the application.

---

## Common Patterns

### Pattern 1: List with Filters

```tsx
const [filter, setFilter] = useState<string>('')

const { data } = trpc.items.list.useQuery({
  filter: filter || undefined,
})

<Select value={filter} onValueChange={setFilter}>
  <SelectTrigger>
    <SelectValue placeholder="Filter" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="">All</SelectItem>
    <SelectItem value="active">Active</SelectItem>
  </SelectContent>
</Select>
```

### Pattern 2: Create with Dialog

```tsx
const [dialogOpen, setDialogOpen] = useState(false)
const [name, setName] = useState('')

const createItem = trpc.items.create.useMutation({
  onSuccess: () => {
    utils.items.list.invalidate()
    setDialogOpen(false)
    setName('')
    toast({ title: 'Item created' })
  },
})

<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
  <DialogTrigger asChild>
    <Button>New Item</Button>
  </DialogTrigger>
  <DialogContent>
    <form onSubmit={(e) => {
      e.preventDefault()
      createItem.mutate({ name })
    }}>
      <DialogHeader>
        <DialogTitle>Create Item</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Item name"
        />
      </div>
      <DialogFooter>
        <Button type="submit">Create</Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

### Pattern 3: Statistics Cards

```tsx
const { data: stats } = trpc.items.stats.useQuery()

<div className="grid gap-4 md:grid-cols-3">
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">Total Items</CardTitle>
      <FileText className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{stats?.total || 0}</div>
    </CardContent>
  </Card>
</div>
```

### Pattern 4: Detail View with Dynamic Route

```tsx
// app/(dashboard)/items/[id]/page.tsx
interface ItemDetailPageProps {
  params: { id: string }
}

export default function ItemDetailPage({ params }: ItemDetailPageProps) {
  const itemId = parseInt(params.id)
  const { data: item, isLoading } = trpc.items.byId.useQuery({ id: itemId })

  if (isLoading) return <div>Loading...</div>
  if (!item) return <div>Item not found</div>

  return <div>{/* Detail view */}</div>
}
```

---

## Troubleshooting

### Issue: Module not found errors

**Solution**: Ensure `transpilePackages` in `next.config.js` includes all workspace packages:
```js
transpilePackages: ['@homelab/ui', '@homelab/api', '@homelab/db']
```

### Issue: TypeScript errors with tRPC queries

**Solution**: Add type assertions to query results:
```tsx
const items = data as MyType[] | undefined
```

### Issue: Theme not applying

**Solution**: Ensure `suppressHydrationWarning` is on the `<html>` tag:
```tsx
<html lang="en" suppressHydrationWarning>
```

### Issue: Components not styled correctly

**Solution**: Verify Tailwind content paths include the UI package:
```ts
content: [
  './src/**/*.{js,ts,jsx,tsx,mdx}',
  '../../packages/ui/src/**/*.{js,ts,jsx,tsx}', // Important!
]
```

### Issue: Build fails with ESM/CommonJS errors

**Solution**: Keep `next.config.js` as CommonJS (don't add `"type": "module"` to package.json)

---

## Success Checklist

Before considering the migration complete:

- [ ] ✅ Zero TypeScript errors (`bun run type-check`)
- [ ] ✅ Successful build (`bun run build`)
- [ ] ✅ All pages render correctly in dev mode
- [ ] ✅ Theme toggle works (light/dark)
- [ ] ✅ tRPC queries return data
- [ ] ✅ tRPC mutations work and invalidate queries
- [ ] ✅ Toast notifications appear
- [ ] ✅ Navigation works between pages
- [ ] ✅ Responsive layout on mobile
- [ ] ✅ Bundle size < 200KB for typical pages

---

## Next Steps

After completing the migration:

1. **Add Deployment Configuration**: Create Docker compose entry
2. **Configure Traefik**: Add routing rules
3. **Test with Real Data**: Verify database integration
4. **Run Lighthouse Audit**: Check performance and accessibility
5. **Document Service-Specific Features**: Add README to your service

**Estimated Total Time**: 2-3 hours for basic service following this guide

---

## Reference Examples

- **Claude Agent Server**: `apps/claude-agent-web` - Full example with projects, sessions, hooks
- **Playwright Server**: `apps/playwright-server` - Example with reports, statistics, detail views
- **UI Components**: `packages/ui/src/components` - All available components
- **API Routers**: `packages/api/src/router` - Shared tRPC routers

---

**Questions?** Check the main README at `packages/ui/README.md` or review existing service implementations.
