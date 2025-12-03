# Quick Start: Unified Design System Implementation

This guide will get you from zero to a working design system in under 30 minutes.

## Prerequisites

- Bun >= 1.0.0 (or Node.js >= 18.0.0)
- Existing `homelab-services` monorepo
- Terminal access

## Step 1: Run the Setup Script (5 minutes)

```bash
cd /Users/leonardoacosta/Personal/Installfest/openspec/changes/implement-unified-design-system

# Make script executable
chmod +x setup-ui-package.sh

# Run setup (creates packages/ui with all configs)
./setup-ui-package.sh
```

This script will:
- Create `packages/ui/` directory structure
- Generate all configuration files (package.json, tsconfig.json, tailwind.config.ts, etc.)
- Set up Dark Professional and Glassmorphism themes
- Install dependencies
- Create theme provider and utilities

## Step 2: Add shadcn/ui Components (10 minutes)

```bash
cd /Users/leonardoacosta/Personal/Installfest/homelab-services/packages/ui

# Install core components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add card
npx shadcn-ui@latest add separator

# Install form components
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add select
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add radio-group
npx shadcn-ui@latest add switch

# Install data display
npx shadcn-ui@latest add table
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add tooltip
npx shadcn-ui@latest add tabs

# Install feedback components
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add alert-dialog
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add skeleton

# Install navigation
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add command
npx shadcn-ui@latest add breadcrumb
```

## Step 3: Update Component Exports (5 minutes)

Edit `packages/ui/src/index.ts` to export all installed components:

```typescript
// Theme
export { ThemeProvider, useTheme } from "./lib/theme-provider"
export { cn } from "./lib/utils"

// Components
export { Button, type ButtonProps } from "./components/ui/button"
export { Input } from "./components/ui/input"
export { Label } from "./components/ui/label"
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from "./components/ui/card"
export { Separator } from "./components/ui/separator"

export { Textarea } from "./components/ui/textarea"
export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator } from "./components/ui/select"
export { Checkbox } from "./components/ui/checkbox"
export { RadioGroup, RadioGroupItem } from "./components/ui/radio-group"
export { Switch } from "./components/ui/switch"

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption } from "./components/ui/table"
export { Badge } from "./components/ui/badge"
export { Avatar, AvatarImage, AvatarFallback } from "./components/ui/avatar"
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./components/ui/tooltip"
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs"

export { useToast, toast } from "./components/ui/use-toast"
export { Toaster } from "./components/ui/toaster"
export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "./components/ui/dialog"
export { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./components/ui/alert-dialog"
export { Alert, AlertTitle, AlertDescription } from "./components/ui/alert"
export { Progress } from "./components/ui/progress"
export { Skeleton } from "./components/ui/skeleton"

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuRadioGroup } from "./components/ui/dropdown-menu"
export { Popover, PopoverTrigger, PopoverContent } from "./components/ui/popover"
export { Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandShortcut, CommandSeparator } from "./components/ui/command"
export { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis } from "./components/ui/breadcrumb"
```

## Step 4: Build the Package (2 minutes)

```bash
cd /Users/leonardoacosta/Personal/Installfest/homelab-services/packages/ui

# Build the package
bun run build

# Verify build succeeded
ls -la dist/
```

You should see:
- `dist/index.js` (CJS)
- `dist/index.mjs` (ESM)
- `dist/index.d.ts` (TypeScript types)

## Step 5: Test in an App (5 minutes)

Create a test page to verify everything works:

```bash
# In your app (e.g., apps/claude-agent or apps/playwright-server)
cd /Users/leonardoacosta/Personal/Installfest/homelab-services/apps/claude-agent

# Add @homelab/ui as dependency
bun add @homelab/ui@workspace:*
```

Create a test component:

```typescript
// apps/claude-agent/src/test-ui.tsx
import { ThemeProvider, Button, Card, CardHeader, CardTitle, CardContent, Badge } from "@homelab/ui"
import "@homelab/ui/styles"

export function TestUI() {
  return (
    <ThemeProvider defaultTheme="dark">
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Design System Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button variant="default">Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
            </div>
            <div className="flex gap-2">
              <Badge variant="in-transit">In Transit</Badge>
              <Badge variant="passed">Passed</Badge>
              <Badge variant="failed">Failed</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </ThemeProvider>
  )
}
```

## Verification Checklist

- [ ] `packages/ui/` directory exists with all files
- [ ] `bun install` completed without errors
- [ ] All shadcn/ui components added to `src/components/ui/`
- [ ] `bun run build` succeeded
- [ ] `dist/` folder contains index.js, index.mjs, index.d.ts
- [ ] Theme switcher works (dark/glass themes)
- [ ] Components render correctly in test app

## Next Steps

After completing this quick start:

1. **Customize Badge Component** - Edit `packages/ui/src/components/ui/badge.tsx` to add logistics-specific variants (see IMPLEMENTATION_GUIDE.md)

2. **Create Custom Components** - Add custom Sidebar, TopBar, Timeline components (templates in IMPLEMENTATION_GUIDE.md)

3. **Add Charts** - Install Recharts and create chart wrappers (see Phase 4 in IMPLEMENTATION_GUIDE.md)

4. **Migrate Claude Agent Server** - Replace existing UI with @homelab/ui components (Phase 6)

5. **Migrate Playwright Server** - Replace existing UI with @homelab/ui components (Phase 7)

## Troubleshooting

### "Module not found: @homelab/ui"

Make sure you:
1. Built the package: `cd packages/ui && bun run build`
2. Added it to your app's package.json: `"@homelab/ui": "workspace:*"`
3. Ran `bun install` in your app

### "Cannot find module '@/components/ui/button'"

This means shadcn/ui components weren't installed. Run:
```bash
cd packages/ui
npx shadcn-ui@latest add button
```

### Themes not working

Make sure you:
1. Imported the styles: `import "@homelab/ui/styles"`
2. Wrapped your app in ThemeProvider
3. Set `data-theme` attribute on root element

## Time Estimate

- Setup script: 5 minutes
- Component installation: 10 minutes
- Exports configuration: 5 minutes
- Build: 2 minutes
- Testing: 5 minutes
- **Total: ~27 minutes**

After this, you have a fully functional design system ready to use!
