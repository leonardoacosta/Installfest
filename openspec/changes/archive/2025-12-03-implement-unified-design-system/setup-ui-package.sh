#!/bin/bash

# Setup script for @homelab/ui design system package
# This script creates the complete UI package structure with all files

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Setting up @homelab/ui design system package...${NC}"

# Navigate to monorepo root
cd /Users/leonardoacosta/Personal/Installfest/homelab-services

# Create directory structure
echo -e "${GREEN}Creating directory structure...${NC}"
mkdir -p packages/ui/src/components/ui
mkdir -p packages/ui/src/components/navigation
mkdir -p packages/ui/src/components/charts
mkdir -p packages/ui/src/components/data-display
mkdir -p packages/ui/src/lib
mkdir -p packages/ui/src/styles
mkdir -p packages/ui/src/themes
mkdir -p packages/ui/src/tokens

# Create package.json
echo -e "${GREEN}Creating package.json...${NC}"
cat > packages/ui/package.json << 'EOF'
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
    "tailwindcss-animate": "^1.0.7",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  }
}
EOF

# Create tsconfig.json
echo -e "${GREEN}Creating tsconfig.json...${NC}"
cat > packages/ui/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": false,
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
EOF

# Create tailwind.config.ts
echo -e "${GREEN}Creating tailwind.config.ts...${NC}"
cat > packages/ui/tailwind.config.ts << 'EOF'
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
EOF

# Create postcss.config.js
echo -e "${GREEN}Creating postcss.config.js...${NC}"
cat > packages/ui/postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# Create components.json (shadcn/ui config)
echo -e "${GREEN}Creating components.json...${NC}"
cat > packages/ui/components.json << 'EOF'
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/styles/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
EOF

# Create globals.css with both themes
echo -e "${GREEN}Creating globals.css with Dark Professional and Glassmorphism themes...${NC}"
cat > packages/ui/src/styles/globals.css << 'EOF'
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

    --border: 0 0% 20%;
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
EOF

# Create utility functions
echo -e "${GREEN}Creating lib/utils.ts...${NC}"
cat > packages/ui/src/lib/utils.ts << 'EOF'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
EOF

# Create theme provider
echo -e "${GREEN}Creating theme provider...${NC}"
cat > packages/ui/src/lib/theme-provider.tsx << 'EOF'
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
EOF

# Create main index file
echo -e "${GREEN}Creating src/index.ts...${NC}"
cat > packages/ui/src/index.ts << 'EOF'
// Export theme provider
export { ThemeProvider, useTheme } from "./lib/theme-provider"

// Export utilities
export { cn } from "./lib/utils"

// Components will be exported here as they're added via shadcn/ui CLI
EOF

# Create README
echo -e "${GREEN}Creating README.md...${NC}"
cat > packages/ui/README.md << 'EOF'
# @homelab/ui

Unified design system for homelab services built with shadcn/ui, React, and Tailwind CSS.

## Features

- 🎨 Two theme variants: Dark Professional and Glassmorphism
- ♿ WCAG 2.1 AA accessible components
- 🎭 Built on Radix UI primitives via shadcn/ui
- 🔧 Full TypeScript support
- 📦 Tree-shakeable exports

## Installation

```bash
cd packages/ui
bun install
```

## Adding Components

Use the shadcn/ui CLI to add components:

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
# etc...
```

## Usage

```typescript
import { ThemeProvider, Button, Card } from "@homelab/ui"
import "@homelab/ui/styles"

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <Card>
        <Button variant="cyan">Click me</Button>
      </Card>
    </ThemeProvider>
  )
}
```

## Available Themes

- `dark` - Dark Professional theme (#0A0A0A background, #00D9D9 cyan primary)
- `glass` - Glassmorphism theme (#E5DDD5 beige, frosted glass effects)

## Development

```bash
# Watch mode
bun run dev

# Build
bun run build

# Type check
bun run type-check
```

## Next Steps

1. Install dependencies: `bun install`
2. Add shadcn/ui components as needed
3. Build the package: `bun run build`
4. Use in your apps: Add `@homelab/ui` as dependency
EOF

# Install dependencies
echo -e "${GREEN}Installing dependencies...${NC}"
cd packages/ui
bun install

echo -e "${BLUE}✓ @homelab/ui package created successfully!${NC}"
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. cd packages/ui"
echo -e "  2. npx shadcn-ui@latest add button input card table"
echo -e "  3. bun run build"
echo ""
echo -e "${GREEN}Package ready at: packages/ui/${NC}"
