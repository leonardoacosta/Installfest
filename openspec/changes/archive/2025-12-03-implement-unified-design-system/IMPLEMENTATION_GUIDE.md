# Implementation Guide: Unified Design System

This guide provides step-by-step instructions and all code needed to implement the unified design system across homelab services.

## Prerequisites

1. Node.js >= 18.0.0 or Bun >= 1.0.0
2. Existing `homelab-services` monorepo at `/Users/leonardoacosta/Personal/Installfest/homelab-services`
3. Terminal access with write permissions

## Phase 1: Foundation & shadcn/ui Setup

### Step 1.1: Create packages/ui Workspace

```bash
cd /Users/leonardoacosta/Personal/Installfest/homelab-services

# Create directory structure
mkdir -p packages/ui/src/components/ui
mkdir -p packages/ui/src/lib
mkdir -p packages/ui/src/styles
mkdir -p packages/ui/src/themes
mkdir -p packages/ui/src/tokens
```

### Step 1.2: Initialize package.json

Create `packages/ui/package.json`:

```json
{
  "name": "@homelab/ui",
  "version": "1.0.0",
  "description": "Unified design system for homelab services",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./styles": "./dist/styles.css"
  },
  "files": [
    "dist",
    "README.md"
  ],
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts --external react --clean",
    "dev": "tsup src/index.ts --format cjs,esm --dts --external react --watch",
    "lint": "eslint src --ext .ts,.tsx",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "peerDependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "dependencies": {
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-tooltip": "^1.0.7",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-radio-group": "^1.1.3",
    "@radix-ui/react-progress": "^1.0.3",
    "@radix-ui/react-alert-dialog": "^1.0.5",
    "@radix-ui/react-popover": "^1.0.7",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.1.0",
    "framer-motion": "^10.16.16",
    "recharts": "^2.10.3"
  },
  "devDependencies": {
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "tsup": "^8.0.1",
    "typescript": "^5.3.3",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  }
}
```

### Step 1.3: Install shadcn/ui

```bash
cd packages/ui

# Initialize shadcn/ui (answers below)
npx shadcn-ui@latest init

# When prompted:
# - Would you like to use TypeScript? › Yes
# - Which style would you like to use? › Default
# - Which color would you like to use as base color? › Slate
# - Where is your global CSS file? › src/styles/globals.css
# - Would you like to use CSS variables for colors? › Yes
# - Where is your tailwind.config.js located? › tailwind.config.ts
# - Configure the import alias for components? › @/components
# - Configure the import alias for utils? › @/lib
# - Are you using React Server Components? › No
```

This will create:
- `tailwind.config.ts`
- `tsconfig.json`
- `components.json`
- `src/lib/utils.ts`
- `src/styles/globals.css`

### Step 1.4: Configure TypeScript

Create `packages/ui/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefines": false,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "jsx": "react-jsx",

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path aliases */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 1.5: Configure Tailwind CSS

Create `packages/ui/tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
```

### Step 1.6: Create Dark Professional Theme

Create `packages/ui/src/styles/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 3.9%;
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 96.1%;
    --secondary-foreground: 0 0% 9%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --accent: 0 0% 96.1%;
    --accent-foreground: 0 0% 9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --ring: 0 0% 3.9%;
    --radius: 0.5rem;
  }

  /* Dark Professional Theme */
  [data-theme="dark"] {
    --background: 0 0% 4%;            /* #0A0A0A */
    --foreground: 0 0% 100%;          /* #FFFFFF */

    --card: 0 0% 10%;                 /* #1A1A1A */
    --card-foreground: 0 0% 100%;

    --popover: 0 0% 10%;
    --popover-foreground: 0 0% 100%;

    --primary: 180 100% 43%;          /* #00D9D9 - Cyan */
    --primary-foreground: 0 0% 4%;

    --secondary: 0 0% 15%;            /* #252525 */
    --secondary-foreground: 0 0% 100%;

    --muted: 0 0% 38%;                /* #606060 */
    --muted-foreground: 0 0% 63%;     /* #A0A0A0 */

    --accent: 180 100% 50%;           /* #00FFE6 - Bright Cyan */
    --accent-foreground: 0 0% 4%;

    --destructive: 4 100% 61%;        /* #FF453A */
    --destructive-foreground: 0 0% 100%;

    --border: 0 0% 20%;               /* rgba(255,255,255,0.1) approximation */
    --input: 0 0% 15%;
    --ring: 180 100% 43%;

    --radius: 0.75rem;
  }

  /* Glassmorphism Theme */
  [data-theme="glass"] {
    --background: 34 23% 85%;         /* #E5DDD5 */
    --foreground: 0 0% 23%;           /* #3A3A3A */

    --card: 34 18% 80%;               /* #D4CCC4 */
    --card-foreground: 0 0% 23%;

    --popover: 34 18% 80%;
    --popover-foreground: 0 0% 23%;

    --primary: 30 13% 48%;            /* #8B7D6B - Muted Brown */
    --primary-foreground: 0 0% 100%;

    --secondary: 34 13% 75%;          /* #C9C1B9 */
    --secondary-foreground: 0 0% 23%;

    --muted: 0 0% 60%;                /* #999999 */
    --muted-foreground: 0 0% 40%;     /* #666666 */

    --accent: 84 48% 67%;             /* #A3D977 - Soft Green */
    --accent-foreground: 0 0% 23%;

    --destructive: 350 76% 64%;       /* #E85D75 */
    --destructive-foreground: 0 0% 100%;

    --border: 0 0% 23% / 0.1;
    --input: 34 13% 75%;
    --ring: 30 13% 48%;

    --radius: 1.5rem;

    /* Glassmorphism-specific effects */
    --glass-bg: rgba(255, 255, 255, 0.7);
    --glass-blur: 20px;
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

/* Glassmorphism glass effect utility */
@layer utilities {
  .glass {
    background: var(--glass-bg);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
  }
}

/* Font imports */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
```

### Step 1.7: Create Utility Functions

Create `packages/ui/src/lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### Step 1.8: Create Theme Provider

Create `packages/ui/src/lib/theme-provider.tsx`:

```typescript
import React, { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "glass"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "dark",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "homelab-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  useEffect(() => {
    const root = window.document.documentElement

    root.removeAttribute("data-theme")
    root.setAttribute("data-theme", theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
```

### Step 1.9: Install Dependencies

```bash
cd packages/ui

# Install dependencies
bun install

# Install Tailwind CSS dependencies
bun add -D tailwindcss autoprefixer postcss tailwindcss-animate

# Install build tool
bun add -D tsup
```

### Step 1.10: Create PostCSS Config

Create `packages/ui/postcss.config.js`:

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### Step 1.11: Create Package Exports

Create `packages/ui/src/index.ts`:

```typescript
// Export theme provider
export { ThemeProvider, useTheme } from "./lib/theme-provider"

// Export utilities
export { cn } from "./lib/utils"

// Components will be exported here as they're added
// Example:
// export { Button } from "./components/ui/button"
```

## Phase 2: Core Components Installation

### Step 2.1: Install shadcn/ui Button Component

```bash
cd packages/ui
npx shadcn-ui@latest add button
```

This creates `src/components/ui/button.tsx`. Customize it with cyan primary color:

```typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-accent",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Custom cyan variant for CTAs
        cyan: "bg-[#00D9D9] text-[#0A0A0A] hover:bg-[#00FFE6] font-semibold",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

Update `src/index.ts`:

```typescript
export { Button, type ButtonProps } from "./components/ui/button"
```

### Step 2.2: Install Form Components

```bash
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add select
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add radio-group
npx shadcn-ui@latest add switch
```

Update exports in `src/index.ts` after each component is added.

### Step 2.3: Install Card Component

```bash
npx shadcn-ui@latest add card
npx shadcn-ui@latest add separator
```

### Step 2.4: Install Data Display Components

```bash
npx shadcn-ui@latest add table
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add tooltip
npx shadcn-ui@latest add tabs
```

Customize Badge for logistics statuses in `src/components/ui/badge.tsx`:

```typescript
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Logistics-specific statuses
        "in-transit": "border-transparent bg-[#00D9D9]/10 text-[#00D9D9]",
        pending: "border-transparent bg-[#FFD60A]/10 text-[#FFD60A]",
        arrived: "border-transparent bg-[#00FF94]/10 text-[#00FF94]",
        delayed: "border-transparent bg-[#FF453A]/10 text-[#FF453A]",
        canceled: "border-transparent bg-muted text-muted-foreground",
        // Test statuses
        passed: "border-transparent bg-[#00FF94]/10 text-[#00FF94]",
        failed: "border-transparent bg-[#FF453A]/10 text-[#FF453A]",
        skipped: "border-transparent bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
```

## Phase 3: Feedback & Navigation Components

### Step 3.1: Install Feedback Components

```bash
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add alert-dialog
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add skeleton
```

### Step 3.2: Install Navigation Components

```bash
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add command
npx shadcn-ui@latest add breadcrumb
```

### Step 3.3: Create Custom Sidebar Component

Create `packages/ui/src/components/navigation/sidebar.tsx`:

```typescript
import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
  ({ className, collapsed = false, onCollapsedChange, children, ...props }, ref) => {
    return (
      <aside
        ref={ref}
        className={cn(
          "flex flex-col border-r bg-card transition-all duration-300",
          collapsed ? "w-16" : "w-64",
          className
        )}
        {...props}
      >
        {children}
      </aside>
    )
  }
)
Sidebar.displayName = "Sidebar"

interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const SidebarHeader = React.forwardRef<HTMLDivElement, SidebarHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex h-16 items-center border-b px-4", className)}
        {...props}
      />
    )
  }
)
SidebarHeader.displayName = "SidebarHeader"

interface SidebarContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const SidebarContent = React.forwardRef<HTMLDivElement, SidebarContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex-1 overflow-auto py-4", className)}
        {...props}
      />
    )
  }
)
SidebarContent.displayName = "SidebarContent"

interface SidebarGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

const SidebarGroup = React.forwardRef<HTMLDivElement, SidebarGroupProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("px-3 py-2", className)}
        {...props}
      />
    )
  }
)
SidebarGroup.displayName = "SidebarGroup"

interface SidebarGroupLabelProps extends React.HTMLAttributes<HTMLDivElement> {}

const SidebarGroupLabel = React.forwardRef<HTMLDivElement, SidebarGroupLabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider",
          className
        )}
        {...props}
      />
    )
  }
)
SidebarGroupLabel.displayName = "SidebarGroupLabel"

interface SidebarMenuProps extends React.HTMLAttributes<HTMLDivElement> {}

const SidebarMenu = React.forwardRef<HTMLDivElement, SidebarMenuProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-1", className)}
        {...props}
      />
    )
  }
)
SidebarMenu.displayName = "SidebarMenu"

interface SidebarMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean
  icon?: React.ReactNode
  collapsed?: boolean
}

const SidebarMenuItem = React.forwardRef<HTMLButtonElement, SidebarMenuItemProps>(
  ({ className, active, icon, collapsed, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant="ghost"
        className={cn(
          "w-full justify-start gap-3",
          active && "bg-accent text-accent-foreground",
          collapsed && "justify-center px-2",
          className
        )}
        {...props}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        {!collapsed && <span>{children}</span>}
      </Button>
    )
  }
)
SidebarMenuItem.displayName = "SidebarMenuItem"

export {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
}
```

### Step 3.4: Create TopBar Component

Create `packages/ui/src/components/navigation/topbar.tsx`:

```typescript
import * as React from "react"
import { cn } from "@/lib/utils"

interface TopBarProps extends React.HTMLAttributes<HTMLElement> {}

const TopBar = React.forwardRef<HTMLElement, TopBarProps>(
  ({ className, ...props }, ref) => {
    return (
      <header
        ref={ref}
        className={cn(
          "sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60",
          className
        )}
        {...props}
      />
    )
  }
)
TopBar.displayName = "TopBar"

interface TopBarContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const TopBarContent = React.forwardRef<HTMLDivElement, TopBarContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex h-16 items-center gap-4 px-4", className)}
        {...props}
      />
    )
  }
)
TopBarContent.displayName = "TopBarContent"

interface TopBarTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const TopBarTitle = React.forwardRef<HTMLHeadingElement, TopBarTitleProps>(
  ({ className, ...props }, ref) => {
    return (
      <h1
        ref={ref}
        className={cn("text-xl font-semibold", className)}
        {...props}
      />
    )
  }
)
TopBarTitle.displayName = "TopBarTitle"

interface TopBarActionsProps extends React.HTMLAttributes<HTMLDivElement> {}

const TopBarActions = React.forwardRef<HTMLDivElement, TopBarActionsProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("ml-auto flex items-center gap-2", className)}
        {...props}
      />
    )
  }
)
TopBarActions.displayName = "TopBarActions"

export { TopBar, TopBarContent, TopBarTitle, TopBarActions }
```

## Phase 4: Charts & Visualizations

### Step 4.1: Install Recharts

```bash
cd packages/ui
bun add recharts
bun add -D @types/recharts
```

### Step 4.2: Create LineChart Wrapper

Create `packages/ui/src/components/charts/line-chart.tsx`:

```typescript
import * as React from "react"
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts"
import { cn } from "@/lib/utils"

interface LineChartProps {
  data: any[]
  dataKeys: {
    x: string
    y: string
  }
  className?: string
  color?: string
}

const CustomTooltip = ({ active, payload }: TooltipProps<any, any>) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-card p-2 shadow-md">
        <p className="text-sm font-medium">{payload[0].payload[payload[0].dataKey]}</p>
      </div>
    )
  }
  return null
}

export function LineChart({ data, dataKeys, className, color = "#00D9D9" }: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%" className={cn(className)}>
      <RechartsLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey={dataKeys.x}
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey={dataKeys.y}
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}
```

### Step 4.3: Create BarChart Wrapper

Create `packages/ui/src/components/charts/bar-chart.tsx`:

```typescript
import * as React from "react"
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts"
import { cn } from "@/lib/utils"

interface BarChartProps {
  data: any[]
  dataKeys: {
    x: string
    y: string
  }
  className?: string
  color?: string
}

const CustomTooltip = ({ active, payload }: TooltipProps<any, any>) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-card p-2 shadow-md">
        <p className="text-sm font-medium">{payload[0].value}</p>
      </div>
    )
  }
  return null
}

export function BarChart({ data, dataKeys, className, color = "#00D9D9" }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%" className={cn(className)}>
      <RechartsBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey={dataKeys.x}
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey={dataKeys.y} fill={color} radius={[4, 4, 0, 0]} />
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}
```

### Step 4.4: Create Timeline Component

Create `packages/ui/src/components/data-display/timeline.tsx`:

```typescript
import * as React from "react"
import { cn } from "@/lib/utils"

interface TimelineProps extends React.HTMLAttributes<HTMLOListElement> {}

const Timeline = React.forwardRef<HTMLOListElement, TimelineProps>(
  ({ className, ...props }, ref) => {
    return (
      <ol
        ref={ref}
        className={cn("relative border-l border-border", className)}
        {...props}
      />
    )
  }
)
Timeline.displayName = "Timeline"

interface TimelineItemProps extends React.HTMLAttributes<HTMLLIElement> {}

const TimelineItem = React.forwardRef<HTMLLIElement, TimelineItemProps>(
  ({ className, ...props }, ref) => {
    return (
      <li
        ref={ref}
        className={cn("mb-10 ml-6", className)}
        {...props}
      />
    )
  }
)
TimelineItem.displayName = "TimelineItem"

interface TimelineIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "error" | "warning"
}

const TimelineIcon = React.forwardRef<HTMLSpanElement, TimelineIconProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variantStyles = {
      default: "bg-primary",
      success: "bg-[#00FF94]",
      error: "bg-[#FF453A]",
      warning: "bg-[#FFD60A]",
    }

    return (
      <span
        ref={ref}
        className={cn(
          "absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-8 ring-background",
          variantStyles[variant],
          className
        )}
        {...props}
      />
    )
  }
)
TimelineIcon.displayName = "TimelineIcon"

interface TimelineContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const TimelineContent = React.forwardRef<HTMLDivElement, TimelineContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("mb-4 rounded-lg border bg-card p-4 shadow-sm", className)}
        {...props}
      />
    )
  }
)
TimelineContent.displayName = "TimelineContent"

interface TimelineTimeProps extends React.HTMLAttributes<HTMLTimeElement> {}

const TimelineTime = React.forwardRef<HTMLTimeElement, TimelineTimeProps>(
  ({ className, ...props }, ref) => {
    return (
      <time
        ref={ref}
        className={cn("mb-1 text-sm font-normal leading-none text-muted-foreground", className)}
        {...props}
      />
    )
  }
)
TimelineTime.displayName = "TimelineTime"

interface TimelineTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const TimelineTitle = React.forwardRef<HTMLHeadingElement, TimelineTitleProps>(
  ({ className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn("text-lg font-semibold", className)}
        {...props}
      />
    )
  }
)
TimelineTitle.displayName = "TimelineTitle"

interface TimelineDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const TimelineDescription = React.forwardRef<HTMLParagraphElement, TimelineDescriptionProps>(
  ({ className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
      />
    )
  }
)
TimelineDescription.displayName = "TimelineDescription"

export {
  Timeline,
  TimelineItem,
  TimelineIcon,
  TimelineContent,
  TimelineTime,
  TimelineTitle,
  TimelineDescription,
}
```

## Next Steps

This guide covers Phases 1-4. The remaining phases (5-8) involve:

- **Phase 5**: Additional polish, accessibility audits, performance optimization
- **Phase 6**: Claude Agent Server migration (React rewrite)
- **Phase 7**: Playwright Server migration (React rewrite)
- **Phase 8**: Final documentation and deployment

Would you like me to continue with the remaining phases or would you prefer to implement Phases 1-4 first and validate the approach?

## Quick Start Script

Save this as `setup-ui-package.sh`:

```bash
#!/bin/bash

set -e

cd /Users/leonardoacosta/Personal/Installfest/homelab-services

echo "Creating packages/ui directory structure..."
mkdir -p packages/ui/src/{components/ui,lib,styles,themes,tokens,components/{navigation,charts,data-display}}

echo "Installing dependencies..."
cd packages/ui
bun install

echo "Initializing shadcn/ui..."
# Note: This requires manual input
npx shadcn-ui@latest init

echo "Installing shadcn components..."
npx shadcn-ui@latest add button input label textarea select checkbox radio-group switch
npx shadcn-ui@latest add card separator table badge avatar tooltip tabs
npx shadcn-ui@latest add toast dialog alert-dialog alert progress skeleton
npx shadcn-ui@latest add dropdown-menu popover command breadcrumb

echo "Installing chart library..."
bun add recharts
bun add -D @types/recharts

echo "Done! UI package initialized."
```

Run with:
```bash
chmod +x setup-ui-package.sh
./setup-ui-package.sh
```
