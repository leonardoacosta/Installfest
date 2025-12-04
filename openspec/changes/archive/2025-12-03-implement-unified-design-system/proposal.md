# Change: Implement Unified Design System for Homelab Services

## Why

The homelab services (Claude Agent Server, Playwright Server, and future applications) currently lack a cohesive design language, leading to:

1. **Inconsistent UX**: Each service has its own UI patterns, colors, and components
2. **Development Inefficiency**: Developers recreate common components for each service
3. **Poor Accessibility**: No standardized approach to ARIA labels, keyboard navigation, or color contrast
4. **Maintenance Overhead**: UI changes require updates across multiple codebases
5. **Unprofessional Appearance**: Lack of polish compared to reference applications

By implementing a unified design system based on proven UI patterns (logistics tracking apps, health monitoring dashboards), we gain:

- **Consistent brand identity** across all homelab services
- **Reusable component library** reducing development time by 60-70%
- **Accessibility by default** with WCAG 2.1 AA compliance
- **Two theme variants** (Dark Professional, Glassmorphism Light) for different use cases
- **Type-safe styling** with TypeScript integration
- **Responsive patterns** that work across desktop, tablet, and mobile

## What Changes

**New Package: `@homelab/ui`**
- Shared UI component library for all homelab services
- Built with React, Tailwind CSS, and Framer Motion
- Supports two theme systems: Dark Professional and Glassmorphism
- Fully typed with TypeScript
- Accessible components (WCAG 2.1 AA)
- Storybook documentation

**Design System Structure:**
```
packages/ui/
├── src/
│   ├── components/        # React components
│   │   ├── navigation/    # Sidebar, TopBar, Breadcrumbs
│   │   ├── data-display/  # Table, List, Card, Badge, Timeline
│   │   ├── forms/         # Input, Select, Checkbox, Radio, DatePicker
│   │   ├── feedback/      # Toast, Modal, Alert, Progress
│   │   ├── charts/        # LineChart, BarChart, PieChart, Sparkline
│   │   └── layout/        # Container, Grid, Stack, Divider
│   ├── themes/            # Theme configurations
│   │   ├── dark.ts        # Dark Professional theme
│   │   └── glass.ts       # Glassmorphism theme
│   ├── tokens/            # Design tokens
│   │   ├── colors.ts      # Color palettes
│   │   ├── typography.ts  # Font scales
│   │   ├── spacing.ts     # Spacing scale
│   │   ├── shadows.ts     # Shadow definitions
│   │   └── animations.ts  # Animation presets
│   └── hooks/             # Utility hooks
│       ├── useTheme.ts
│       ├── useMediaQuery.ts
│       └── useAccessibility.ts
├── .storybook/            # Component documentation
└── tailwind.config.ts     # Tailwind theme extension
```

**Theme 1: Dark Professional**
- **Primary Use**: Claude Agent Server, Playwright Server
- **Inspiration**: Logistics tracking application (Images 1-3)
- **Color Palette**:
  - Background: `#0A0A0A` (deep black), `#1A1A1A` (elevated surfaces)
  - Primary: `#00D9D9` (cyan) for CTAs and links
  - Accent: `#00FFE6` (bright cyan) for hover states
  - Success: `#00FF94`, Warning: `#FFD60A`, Error: `#FF453A`
  - Text: `#FFFFFF` (primary), `#A0A0A0` (secondary), `#606060` (tertiary)
- **Typography**: Inter (body), JetBrains Mono (code)
- **Key Features**:
  - High contrast for readability
  - Subtle borders and dividers
  - Card-based layouts with elevation
  - Status badges with semantic colors
  - Map integration support

**Theme 2: Glassmorphism**
- **Primary Use**: Future health/monitoring dashboards
- **Inspiration**: Sleep tracking application (Image 4)
- **Color Palette**:
  - Background: `#E5DDD5` (warm beige), `#D4CCC4` (elevated surfaces)
  - Primary: `#8B7D6B` (muted brown) for text and borders
  - Accent: `#A3D977` (soft green) for positive indicators
  - Text: `#3A3A3A` (primary), `#666666` (secondary)
- **Effects**:
  - Frosted glass: `backdrop-filter: blur(20px)` + `background: rgba(255,255,255,0.7)`
  - Soft shadows: `box-shadow: 0 8px 32px rgba(0,0,0,0.08)`
  - Rounded corners: `border-radius: 24px` for cards
- **Key Features**:
  - Soft, calming aesthetic
  - Data visualization optimized
  - Minimalist icon usage
  - Subtle micro-interactions

**Component Library (30+ Components):**

*Navigation*:
- `Sidebar` - Collapsible navigation with icons
- `TopBar` - Header with search, notifications, user menu
- `Breadcrumbs` - Hierarchical navigation
- `Tabs` - Horizontal/vertical tab navigation

*Data Display*:
- `Table` - Sortable, filterable data table
- `List` - Virtualized list with infinite scroll
- `Card` - Container with header, body, footer
- `Badge` - Status indicators (IN TRANSIT, PENDING, etc.)
- `Timeline` - Event timeline visualization
- `Avatar` - User/entity avatar with fallback
- `Tooltip` - Contextual information

*Forms*:
- `Input` - Text input with validation
- `TextArea` - Multi-line text input
- `Select` - Dropdown with search
- `Checkbox` - Single/group checkboxes
- `Radio` - Radio button groups
- `Switch` - Toggle switch
- `DatePicker` - Date/time selection
- `RangeSlider` - Numeric range input
- `FileUpload` - Drag-drop file upload

*Feedback*:
- `Toast` - Notification messages
- `Modal` - Dialog overlays
- `Alert` - Inline alerts
- `Progress` - Linear/circular progress
- `Skeleton` - Loading placeholders
- `EmptyState` - No data states

*Charts* (via Recharts):
- `LineChart` - Time series data
- `BarChart` - Categorical comparisons
- `PieChart` - Proportional data
- `Sparkline` - Inline mini charts
- `MapView` - Integrated mapping (via Mapbox)

*Layout*:
- `Container` - Responsive container
- `Grid` - CSS Grid wrapper
- `Stack` - Vertical/horizontal stack
- `Divider` - Visual separator

**Integration with Existing Services:**

*Claude Agent Server*:
- Replace vanilla HTML/CSS with `@homelab/ui` components
- Apply Dark Professional theme
- Use `Table` for session/hook lists
- Use `Card` for project cards
- Use `LineChart` for hook statistics

*Playwright Server*:
- Replace vanilla HTML/CSS with `@homelab/ui` components
- Apply Dark Professional theme
- Use `Table` for test report listings
- Use `Badge` for test status (passed, failed, skipped)
- Use `Timeline` for test execution history

**Breaking Changes:**
- **BREAKING**: Claude Agent Server frontend completely rewritten with React
- **BREAKING**: Playwright Server frontend completely rewritten with React
- **BREAKING**: Requires React 18+, Tailwind CSS 3.4+

**Backward Compatibility:**
- Backend APIs remain unchanged (tRPC/Express)
- Docker deployment configuration preserved
- Database schemas unchanged
- Existing routes and URLs maintained

## Impact

**Affected Specs:**
- `ui-design-system` (NEW) - Design system documentation and guidelines
- `ui-component-library` (NEW) - Component API specifications
- `claude-agent-ui` (NEW) - Claude Agent Server frontend implementation
- `playwright-server-ui` (NEW) - Playwright Server frontend implementation

**Affected Code:**
- `packages/ui/` (NEW) - Shared UI component library
- `apps/claude-agent/src/client/` - Frontend rewrite with @homelab/ui
- `apps/playwright-server/web/` - Frontend rewrite with @homelab/ui
- `packages/tsconfig/` - Shared TypeScript configuration for UI packages
- `.storybook/` (NEW) - Component documentation

**Benefits:**
- **Development Speed**: 60-70% faster UI development with reusable components
- **Consistency**: Unified design language across all homelab services
- **Accessibility**: WCAG 2.1 AA compliance out of the box
- **Maintainability**: Single source of truth for UI patterns
- **Quality**: Professional-grade UI matching commercial applications
- **Future-Proof**: Easy to add new services with consistent UI

**Risks:**
- **Learning Curve**: Team needs to learn component library API
- **Migration Effort**: Rewriting existing frontends is significant work (40-60 hours)
- **Bundle Size**: Shared components may increase initial bundle size
- **Theme Lock-In**: Switching themes requires coordination across services
- **Breaking Changes**: Existing frontend code will be discarded

**Migration Strategy:**
1. Create `@homelab/ui` package with core components
2. Set up Storybook for component documentation
3. Implement Dark Professional theme first (primary use case)
4. Migrate Claude Agent Server frontend (1-2 weeks)
5. Migrate Playwright Server frontend (1 week)
6. Implement Glassmorphism theme (optional, for future services)
7. Document component usage patterns
8. Create migration guide for future services
