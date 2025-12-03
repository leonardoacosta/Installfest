# @homelab/ui

Production-ready design system for homelab services built with shadcn/ui, React, and Tailwind CSS.

## Features

- 🎨 **Dual Themes**: Dark Professional (#00D9D9 cyan) and Glassmorphism (beige glass)
- ♿ **Accessible**: WCAG 2.1 AA compliant with keyboard navigation and screen reader support
- 🎭 **Radix UI**: Built on accessibility primitives via shadcn/ui
- 📊 **Charts**: Recharts integration with theme-aware colors
- 🔧 **TypeScript**: Full type safety with IntelliSense
- 📦 **Tree-shakeable**: Import only what you need (CJS/ESM dual output)
- 🎯 **37 Components**: 27 shadcn/ui base + 10 custom components

## Documentation

- **[Component API Reference](./COMPONENTS.md)** - Complete API documentation for all components
- **[Accessibility Guide](./ACCESSIBILITY.md)** - WCAG compliance, keyboard navigation, screen reader testing
- **[Examples](./examples/README.md)** - Live examples, showcase pages, and usage patterns

## Installation

### For Package Development

```bash
cd packages/ui
bun install
bun run build
```

### As a Dependency (Monorepo)

```json
// In your app's package.json
{
  "dependencies": {
    "@homelab/ui": "workspace:*"
  }
}
```

## Quick Start

```tsx
import { ThemeProvider, Button, Card, CardHeader, CardTitle, CardContent } from "@homelab/ui"
import "@homelab/ui/styles"

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to @homelab/ui</CardTitle>
          </CardHeader>
          <CardContent>
            <Button>Get Started</Button>
          </CardContent>
        </Card>
      </div>
    </ThemeProvider>
  )
}
```

## Available Components

### Navigation
- `Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarItem` - Collapsible sidebar with icon-only mode
- `TopBar`, `TopBarSearch`, `TopBarActions`, `TopBarThemeToggle` - Header with search and actions
- `Breadcrumb` - Hierarchical navigation trail

### Forms
- `Button` - Versatile button with multiple variants
- `Input` - Text input field
- `Textarea` - Multi-line text input
- `Select` - Dropdown selection
- `Checkbox` - Checkable boolean input
- `RadioGroup` - Mutually exclusive options
- `Switch` - Toggle switch
- `Label` - Form field label

### Data Display
- `Badge` - Status indicators with semantic variants (passed/failed/running/etc.)
- `Card` - Content container with header/footer
- `Table` - Data tables with sorting support
- `Timeline` - Vertical event timeline
- `Avatar` - User profile pictures
- `Separator` - Visual divider

### Feedback
- `Alert` - Prominent notification messages
- `Toast` / `Toaster` - Temporary popup notifications
- `Progress` - Loading progress bar
- `Skeleton` - Loading placeholder
- `EmptyState` - No data placeholder
- `LoadingState` - Loading indicator
- `ErrorState` - Error message display

### Overlay
- `Dialog` - Modal dialogs
- `Sheet` - Slide-out panels
- `Popover` - Floating content
- `Tooltip` - Hover/focus info popups
- `DropdownMenu` - Context menus

### Charts (Recharts Integration)
- `ChartContainer` - Responsive wrapper with theme integration
- `SimpleLineChart` - Line chart
- `AreaLineChart` - Area chart with gradient
- `SimpleBarChart` - Vertical/horizontal bar chart
- `SimplePieChart` / `DonutChart` - Pie and donut charts
- `Sparkline` / `Sparkbar` - Inline mini charts

## Themes

### Dark Professional
- Background: `#0A0A0A` (near black)
- Primary: `#00D9D9` (cyan)
- Success: `#00FF94` (green)
- Warning: `#FFD60A` (yellow)
- Error: `#FF453A` (red)

### Glassmorphism
- Background: `#E5DDD5` (beige)
- Primary: `#8B7D6B` (muted brown)
- Secondary: `#A3D977` (soft green)
- Glass effects: Frosted backdrop blur

### Theme Toggle

```tsx
import { useTheme } from "@homelab/ui"

function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button onClick={() => setTheme(theme === "dark" ? "glass" : "dark")}>
      Toggle Theme
    </button>
  )
}
```

## Development

### Build Commands

```bash
# Watch mode for development
bun run dev

# Production build (CJS + ESM + types)
bun run build

# Type checking
bun run type-check
```

### Adding New Components

Use the shadcn/ui CLI to add base components:

```bash
npx shadcn-ui@latest add <component-name>

# Examples:
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add dialog
```

Then export from `src/index.ts`:

```typescript
export { Button, type ButtonProps } from "./components/ui/button"
```

### Build Output

- **CJS**: `dist/index.js` (~104 KB)
- **ESM**: `dist/index.mjs` (~88 KB)
- **Types**: `dist/index.d.ts` (~38 KB)

All outputs are tree-shakeable. Import only what you need:

```tsx
// ✅ Good: Only imports Button code
import { Button } from "@homelab/ui"

// ❌ Bad: Imports entire library
import * as UI from "@homelab/ui"
```

## Examples

See the [`examples/`](./examples/) directory for:
- **Full component showcase** - All components in one page
- **Dashboard example** - Real-world test monitoring dashboard
- **Accessibility testing** - Keyboard nav, screen reader testing
- **Responsive design** - Mobile/tablet/desktop testing

Run examples in a Vite or Next.js app:

```tsx
import { ComponentShowcase } from '@homelab/ui/examples/showcase'
import { DashboardExample } from '@homelab/ui/examples/dashboard'

export default function Page() {
  return <ComponentShowcase />
}
```

## TypeScript

Full TypeScript support with exported types:

```typescript
import type { ButtonProps, BadgeProps, CardProps } from "@homelab/ui"

// Custom button with type safety
const MyButton: React.FC<ButtonProps> = (props) => {
  return <Button {...props} />
}
```

## Contributing

When adding components:

1. Follow shadcn/ui conventions (copy-paste, not npm install)
2. Ensure WCAG 2.1 AA compliance (see [ACCESSIBILITY.md](./ACCESSIBILITY.md))
3. Add TypeScript types and JSDoc comments
4. Export from `src/index.ts`
5. Test with keyboard navigation and screen reader
6. Add example usage to `examples/`
7. Update component list in this README

## License

MIT
