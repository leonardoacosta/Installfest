# Design Document: Unified Design System for Homelab Services

## Context

The homelab project currently has two web-based services that need professional UIs:
1. **Claude Agent Server**: Multi-project agent management dashboard with real-time hook tracking
2. **Playwright Server**: Test report aggregation and visualization dashboard

Both services currently use basic HTML/CSS without a cohesive design system. As more services are added to the homelab (future monitoring dashboards, service management UIs), the need for a unified design language becomes critical.

**Reference Applications (from provided images):**
- **Images 1-3**: Logistics tracking application with dark theme, map integration, shipment lists, and detailed tracking modals
- **Image 4**: Health monitoring application with glassmorphism design, sleep tracking charts, and minimalist aesthetics

**Problems with Current State:**
1. Vanilla HTML/CSS requires writing everything from scratch
2. No component reuse between services
3. Inconsistent typography, spacing, and colors
4. Poor accessibility (no ARIA labels, keyboard navigation)
5. No theming system
6. Manual responsive design for each component
7. Difficult to maintain as services grow

**Opportunity:**
Create a production-quality design system that rivals commercial applications, enabling rapid development of new UIs while maintaining consistency and professionalism.

## Goals / Non-Goals

**Goals:**
- Create reusable UI component library (`@homelab/ui`) shared across all services
- Support two distinct theme variants (Dark Professional, Glassmorphism)
- Ensure WCAG 2.1 AA accessibility compliance
- Provide excellent DX with TypeScript, Storybook, and component composition
- Enable rapid prototyping of new service UIs (< 1 week for simple dashboards)
- Match or exceed the quality of reference applications
- Integrate seamlessly with existing tRPC/Express backends

**Non-Goals:**
- Supporting legacy browsers (IE11, old Safari versions)
- Mobile-native applications (focus is web-based)
- Custom design tools or Figma plugins
- Animation-heavy experiences (subtle motion only)
- White-labeling or customer branding (single homelab use)
- Server-side rendering optimization (client-side React is fine)
- Supporting other frameworks (Vue, Svelte, Angular)

## Decisions

### 1. Component Library: shadcn/ui + React + Tailwind CSS

**Decision:** Use shadcn/ui as the component foundation with React 18 and Tailwind CSS, customizing components to match our design tokens.

**Why:**
- **shadcn/ui**: Copy-paste components you own, not a dependency - perfect for customization
- **Battle-tested Accessibility**: Built on Radix UI primitives with WCAG AA compliance out of the box
- **Rapid Development**: 50+ pre-built components ready to customize (saves 100+ hours vs building from scratch)
- **Full Control**: Components are copied into your codebase, not imported from node_modules
- **TypeScript Native**: Excellent type safety and IntelliSense support
- **Tailwind CSS**: Utility-first styling matches our design approach
- **Active Community**: Extensive examples and documentation

**How shadcn/ui Works:**
1. CLI copies component source code directly into your project (`components/ui/`)
2. You own the code - customize freely without forking
3. Uses Radix UI for accessibility primitives + Tailwind for styling
4. Updates are manual (copy new version), giving you version control

**Customization Approach:**
- Override default design tokens in `tailwind.config.ts`
- Customize component variants to match Dark Professional and Glassmorphism themes
- Extend components with additional features as needed
- All customizations stay in your codebase

**Alternatives Considered:**
- **Material-UI**: Too opinionated, doesn't match reference aesthetics, large bundle size
- **Custom Components**: Would take 100+ hours to build, test, and document
- **Headless UI only**: Still requires full visual implementation
- **CSS-in-JS (Emotion/Styled)**: Adds runtime overhead, Tailwind CSS provides better DX

**Implementation:**
```bash
# Install shadcn/ui components
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input card table

# Components are copied to src/components/ui/
# Customize in place - you own the code
```

```tsx
// Customized Button component with our theme
import { Button } from "@/components/ui/button"

export function CyanButton() {
  return (
    <Button className="bg-cyan-500 hover:bg-cyan-400">
      New Order
    </Button>
  )
}
```

### 2. Theme System: CSS Variables + Tailwind

**Decision:** Use CSS custom properties for theme values, extended through Tailwind configuration.

**Why:**
- Runtime theme switching without reloading page
- Type-safe theme access through Tailwind classes
- Aligns perfectly with shadcn/ui's theme system
- No JavaScript required for theme application
- Supports system preference detection (`prefers-color-scheme`)

**Implementation:**
```css
/* themes/dark.css */
:root[data-theme="dark"] {
  --color-background: 10 10 10;          /* #0A0A0A */
  --color-surface: 26 26 26;             /* #1A1A1A */
  --color-primary: 0 217 217;            /* #00D9D9 */
  --color-text-primary: 255 255 255;     /* #FFFFFF */
  --color-text-secondary: 160 160 160;   /* #A0A0A0 */

  --shadow-sm: 0 1px 2px rgba(0,0,0,0.5);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.3);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.2);

  --radius-sm: 0.375rem;  /* 6px */
  --radius-md: 0.5rem;    /* 8px */
  --radius-lg: 0.75rem;   /* 12px */
}

/* themes/glass.css */
:root[data-theme="glass"] {
  --color-background: 229 221 213;       /* #E5DDD5 */
  --color-surface: 212 204 196;          /* #D4CCC4 */
  --color-primary: 139 125 107;          /* #8B7D6B */
  --color-text-primary: 58 58 58;        /* #3A3A3A */

  --glass-bg: rgba(255, 255, 255, 0.7);
  --glass-blur: blur(20px);
  --glass-border: rgba(255, 255, 255, 0.3);

  --radius-sm: 0.75rem;   /* 12px */
  --radius-md: 1rem;      /* 16px */
  --radius-lg: 1.5rem;    /* 24px */
}
```

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--color-background) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
      },
      backdropBlur: {
        glass: 'var(--glass-blur)',
      },
    },
  },
};
```

**Alternatives Considered:**
- **Separate Tailwind configs**: Duplicates configuration, no runtime switching
- **Theme Context API**: Requires JavaScript, slower performance, no SSR support
- **CSS Modules**: Verbose, poor DX compared to Tailwind

### 3. Dark Professional Theme (Primary)

**Decision:** Make Dark Professional the default theme, inspired by logistics tracking application (Images 1-3).

**Why:**
- Matches use case: technical dashboards for developers
- Reduces eye strain during long development sessions
- Professional appearance for homelab services
- High contrast aids readability of data-dense interfaces
- Maps and visualizations pop against dark backgrounds

**Color Palette Rationale:**
- **Cyan Primary (`#00D9D9`)**: High visibility against dark background, tech-forward aesthetic
- **Deep Black (`#0A0A0A`)**: True black for OLED displays, modern feel
- **Elevated Surfaces (`#1A1A1A`)**: Subtle elevation without harsh borders
- **Semantic Colors**: Traffic light system (green=success, yellow=warning, red=error)

**Typography:**
- **Inter**: Excellent readability at small sizes, professional sans-serif, extensive character set
- **JetBrains Mono**: Code blocks and technical data, ligature support, optimized for terminals

**Component Patterns:**
- **Cards**: Elevated surfaces (`bg-surface`) with subtle borders
- **Badges**: Rounded pills with semantic background colors
- **Tables**: Alternating row backgrounds for scannability
- **Modals**: Backdrop blur + dark overlay

### 4. Glassmorphism Theme (Secondary)

**Decision:** Implement Glassmorphism as optional theme for future health/monitoring services.

**Why:**
- Provides visual variety for different service types
- Calming aesthetic appropriate for monitoring dashboards
- Showcases design system flexibility
- Modern design trend that's accessible when done correctly

**Key Techniques:**
- `backdrop-filter: blur(20px)` for frosted glass effect
- Semi-transparent backgrounds (`rgba(255,255,255,0.7)`)
- Soft shadows instead of borders
- Generous border-radius (24px+)
- Subtle gradients for depth

**Accessibility Considerations:**
- Ensure text contrast meets WCAG AA (4.5:1 for normal text)
- Avoid pure glass overlays on busy backgrounds
- Provide solid color fallback for browsers without `backdrop-filter`
- Test with low-vision simulators

### 5. Component Composition Pattern

**Decision:** Use compound components pattern for complex components, atomic components for simple ones.

**Why:**
- **Compound Components**: Flexible API, easy to customize, clear parent-child relationships
- **Atomic Components**: Simple, predictable, easy to test

**Example - Card (Compound):**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Shipment Details</CardTitle>
    <CardActions>
      <Button variant="ghost">Edit</Button>
    </CardActions>
  </CardHeader>
  <CardBody>
    <ShipmentTimeline data={shipmentData} />
  </CardBody>
  <CardFooter>
    <Badge variant="success">IN TRANSIT</Badge>
    <Text variant="secondary">ETA: Nov 20, 2024</Text>
  </CardFooter>
</Card>
```

**Example - Button (Atomic):**
```tsx
<Button variant="primary" size="lg" onClick={handleClick}>
  New Order
</Button>
```

**Alternatives Considered:**
- **Render Props**: Too verbose, poor TypeScript inference
- **Higher-Order Components**: Difficult to compose, naming conflicts
- **Hooks-only**: Loses component tree structure, harder to style

### 6. Accessibility Strategy

**Decision:** Build accessibility into every component from day one, targeting WCAG 2.1 AA.

**Why:**
- **Legal Compliance**: Many jurisdictions require accessibility
- **Better UX**: Keyboard navigation, screen reader support benefit all users
- **Future-Proof**: Easier to maintain than retrofitting
- **Quality Signal**: Professional applications are accessible by default

**Implementation Checklist per Component:**
- [ ] Semantic HTML (`<button>`, `<nav>`, `<main>`, etc.)
- [ ] ARIA labels where needed (`aria-label`, `aria-describedby`)
- [ ] Keyboard navigation (Tab, Enter, Escape, Arrow keys)
- [ ] Focus management (visible focus ring, focus trap in modals)
- [ ] Color contrast (4.5:1 for text, 3:1 for UI components)
- [ ] Screen reader testing (VoiceOver, NVDA)
- [ ] Motion preferences (`prefers-reduced-motion`)

**Tools:**
- **axe DevTools**: Automated accessibility testing
- **Lighthouse**: Accessibility audit
- **React Testing Library**: Test accessibility in unit tests
- **Storybook a11y addon**: Visual accessibility checks

### 7. Animation Strategy

**Decision:** Use Framer Motion for declarative animations, keep animations subtle and purposeful.

**Why:**
- **Framer Motion**: Best-in-class animation library for React, excellent TypeScript support
- **Subtle Motion**: Enhances UX without distracting (200-300ms transitions)
- **Purposeful**: Animations communicate state changes, not decoration

**Animation Patterns:**
- **Page Transitions**: Fade + slide (200ms)
- **Modal Entry**: Scale + fade (250ms)
- **Hover Effects**: Color/scale transitions (150ms)
- **Loading States**: Skeleton shimmer, spinner rotation
- **Data Updates**: Number count-up, chart transitions

**Example:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.2 }}
>
  {children}
</motion.div>
```

**Respect User Preferences:**
```tsx
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

<motion.div
  animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
>
  {children}
</motion.div>
```

### 8. Documentation Approach

**Decision:** Use in-app documentation and shadcn/ui docs instead of Storybook.

**Why:**
- **shadcn/ui Documentation**: Comprehensive component docs already exist at ui.shadcn.com
- **Code as Documentation**: Components live in actual app pages, not isolated stories
- **Faster Development**: Skip Storybook setup and maintenance overhead
- **Real Context**: See components in actual use cases within the app
- **TypeScript IntelliSense**: JSDoc comments + TypeScript provide inline documentation in VS Code

**Documentation Strategy:**
1. **Reference shadcn/ui docs** for base component usage and props
2. **JSDoc comments** in customized components for team-specific modifications
3. **Example pages** in `/examples` route showing component patterns
4. **README.md** in `packages/ui/` with quick start and customization guide
5. **TypeScript types** serve as API documentation

**Example Documentation:**
```tsx
/**
 * Custom shipment status badge with logistics-specific variants
 * Based on shadcn/ui Badge component
 *
 * @example
 * <StatusBadge status="in-transit" />
 * <StatusBadge status="delayed" />
 */
export function StatusBadge({ status }: StatusBadgeProps) {
  // Component implementation
}
```

**Benefits vs Storybook:**
- Save ~20 hours of Storybook setup and story writing
- No additional build tool to maintain
- Components tested in real app context, not isolation
- Faster iteration cycle (no Storybook rebuild needed)

## Risks / Trade-offs

### Risk: Learning Curve for shadcn/ui

**Impact:** Team must learn shadcn/ui component patterns and customization approach

**Mitigation:**
- shadcn/ui has excellent documentation at ui.shadcn.com
- Components follow React best practices and familiar patterns
- TypeScript IntelliSense provides inline prop documentation
- Migration guide with before/after examples
- Active community with numerous examples and templates

### Risk: Migration Effort is Significant

**Impact:** Rewriting existing frontends requires 40-60 hours of development time

**Mitigation:**
- Migrate one service at a time (Claude Agent first, Playwright second)
- Backend APIs unchanged, only frontend affected
- Can run old and new UI side-by-side during transition
- Use feature flags to gradually roll out new UI

### Risk: Bundle Size Increase

**Impact:** Shared component library may increase initial bundle size

**Mitigation:**
- Tree-shaking to eliminate unused components
- Code splitting by route
- Lazy loading for heavy components (charts, maps)
- Target: Keep main bundle < 200KB gzipped

**Measurement:**
```bash
# Before (vanilla HTML/CSS)
- index.html: 12KB
- styles.css: 8KB
- script.js: 25KB
Total: 45KB

# After (@homelab/ui)
- vendor.js (React + libs): ~150KB gzipped
- app.js: ~50KB gzipped
- styles.css: ~20KB gzipped
Total: ~220KB (acceptable for rich dashboard)
```

### Risk: Theme Lock-In

**Impact:** Changing themes requires coordination across all services

**Mitigation:**
- Design tokens are centralized, changing theme values updates all services
- Theme switching is user preference (localStorage), not deploy-time decision
- Both themes maintained in parallel, no "dark mode only" components

### Trade-off: React Only vs Framework Agnostic

**Decision:** React only, no Vue/Svelte/Angular support

**Justification:**
- All homelab services use React already
- Framework-agnostic components add complexity (web components, headless UI)
- Reduces bundle size and improves DX
- Team expertise concentrated in React

**Cost:** Future services must use React for UI consistency

### Trade-off: shadcn/ui vs Custom Components

**Decision:** Use shadcn/ui, customize to match our themes

**Why shadcn/ui:**
- Faster initial development (copy-paste components, saves 100+ hours)
- Battle-tested accessibility built on Radix UI primitives
- Active community with extensive examples
- You own the code - components live in your repo, fully customizable
- Excellent TypeScript support and documentation
- Can match our reference designs through Tailwind customization

**Why Not Custom:**
- Building from scratch takes 100+ hours for 30+ components
- Must implement accessibility from ground up (ARIA, keyboard nav, focus management)
- Requires ongoing maintenance and bug fixes
- Slower iteration velocity

**Customization Approach:**
1. Install shadcn/ui components via CLI (copies source to your repo)
2. Customize Tailwind config with our Dark Professional / Glassmorphism tokens
3. Modify component variants to match reference designs (cyan accents, etc.)
4. Extend components with app-specific features (e.g., logistics status badges)

**Justification:** shadcn/ui provides the perfect balance - we get production-ready, accessible components AND full customization control. The "copy-paste" model means no dependency lock-in.

## Migration Plan

### Phase 1: Foundation (Week 1)
1. Initialize shadcn/ui in packages/ui workspace (`npx shadcn-ui@latest init`)
2. Configure Tailwind CSS with Dark Professional theme tokens
3. Set up CSS custom properties for theme system
4. Create theme provider component
5. Add Glassmorphism theme variant
6. Create README.md with setup and customization guide

### Phase 2: Install Core Components (Week 2)
1. Install shadcn/ui components: `button input label card separator`
2. Customize components with Dark Professional colors (cyan accents)
3. Add custom variants for logistics-specific use cases
4. Install form components: `select checkbox radio-group switch textarea`
5. Test all components in both themes

### Phase 3: Install Data Display Components (Week 3)
1. Install: `table badge avatar tooltip tabs`
2. Customize Badge with status variants (in-transit, pending, arrived, delayed)
3. Customize Table for sortable/filterable shipment lists
4. Create custom Timeline component (not in shadcn)
5. Test virtualization for long lists

### Phase 4: Install Feedback & Navigation (Week 4)
1. Install: `toast dialog alert-dialog progress skeleton`
2. Create custom Sidebar navigation component
3. Create custom TopBar component
4. Install: `dropdown-menu popover command`
5. Configure toast notifications with theme-aware styling

### Phase 5: Charts & Advanced Components (Week 5)
1. Install Recharts library for data visualization
2. Create LineChart wrapper with theme integration
3. Create BarChart and Sparkline components
4. Install MapView (Mapbox GL) for shipment routes
5. Create EmptyState component for no-data views

### Phase 6: Claude Agent Migration (Week 6-7)
1. Install @homelab/ui in Claude Agent Server
2. Migrate project list page with Table component
3. Migrate session view with custom cards and badges
4. Migrate hooks dashboard with charts
5. Add real-time updates with tRPC subscriptions
6. Testing and polish

### Phase 7: Playwright Server Migration (Week 8)
1. Install @homelab/ui in Playwright Server
2. Migrate test report list with Table
3. Migrate test detail view with cards
4. Add test statistics dashboard
5. Testing and deployment

### Phase 8: Documentation & Polish (Week 9)
1. Create example pages showing component patterns
2. Add JSDoc comments to custom components
3. Document theme customization workflow
4. Create migration guide for future services
5. Final accessibility audit with axe DevTools

## Success Metrics

**Technical Metrics:**
- Component library covers 90%+ of UI needs (minimize one-off components)
- Accessibility score >95 in Lighthouse audits
- WCAG 2.1 AA compliance verified with axe DevTools
- Bundle size < 250KB gzipped for typical dashboard page
- Component render time < 16ms (60fps)

**Developer Experience:**
- New service UI can be built in < 1 week using shadcn/ui components
- All customized components have JSDoc documentation
- TypeScript provides full type safety for component props
- Zero console warnings in development mode
- shadcn/ui CLI makes adding new components effortless (`npx shadcn-ui add <component>`)

**User Experience:**
- Subjective quality matches or exceeds reference applications
- All interactions keyboard accessible
- Forms validate in real-time with clear error messages
- Loading states prevent layout shift

**Operational Metrics:**
- No regression in API performance (frontend-only change)
- Docker builds complete in < 5 minutes
- Hot reload in development < 500ms
