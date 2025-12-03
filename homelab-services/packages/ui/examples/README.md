# UI Library Examples

This directory contains comprehensive examples demonstrating all components from the `@homelab/ui` library.

## Available Examples

### 1. Component Showcase (`showcase.tsx`)

Complete showcase of all available components with interactive examples.

**Includes:**
- All button variants and sizes
- Badge variants (including logistics and test statuses)
- Form controls (inputs, selects, checkboxes, radio groups)
- Alerts and notifications
- Timeline component
- State components (empty, loading, error)
- All chart types (line, area, bar, pie, donut, sparklines)
- Data tables
- Overlays (dialogs, sheets, popovers, tooltips)
- Progress bars and skeleton loaders
- Avatars
- Navigation (sidebar, topbar, breadcrumbs)

**Use this for:**
- Visual testing of all components
- Accessibility audits
- Responsive design validation
- Component API reference

### 2. Dashboard Example (`dashboard.tsx`)

Real-world dashboard layout for test run monitoring and agent session tracking.

**Features:**
- Stats cards with sparklines
- Multi-series bar charts
- Donut charts for status distribution
- Area charts for time-series data
- Data tables for recent activity
- Badge usage for status indicators

**Perfect for:**
- Playwright Server test report dashboard
- Claude Agent Server session monitoring
- General admin dashboards

## Running Examples

These examples are designed to be used in a React application. To run them:

### Option 1: Standalone Development

```bash
# Create a new Vite + React app
npm create vite@latest example-app -- --template react-ts
cd example-app

# Install dependencies
npm install
npm install @homelab/ui

# Copy example files to src/
cp ../examples/showcase.tsx src/
cp ../examples/dashboard.tsx src/

# Update App.tsx to render example
# Then start dev server
npm run dev
```

### Option 2: In Existing Next.js App

```tsx
// app/showcase/page.tsx
import { ComponentShowcase } from '@homelab/ui/examples/showcase'

export default function ShowcasePage() {
  return <ComponentShowcase />
}
```

### Option 3: Storybook Integration

```tsx
// .storybook/stories/Showcase.stories.tsx
import { ComponentShowcase } from '@homelab/ui/examples/showcase'

export default {
  title: 'Examples/Showcase',
  component: ComponentShowcase,
}

export const Default = () => <ComponentShowcase />
```

## Accessibility Testing

Use these examples to validate WCAG 2.1 AA compliance:

### Keyboard Navigation

Test all interactive elements:

- **Tab**: Navigate forward through focusable elements
- **Shift + Tab**: Navigate backward
- **Enter/Space**: Activate buttons and controls
- **Arrow keys**: Navigate within radio groups, selects, and menus
- **Escape**: Close dialogs, sheets, popovers

### Screen Reader Testing

Recommended tools:
- **NVDA** (Windows, free)
- **JAWS** (Windows, commercial)
- **VoiceOver** (macOS/iOS, built-in)
- **TalkBack** (Android, built-in)

Key areas to test:
- Form labels and descriptions
- Button aria-labels
- Status badges announced correctly
- Chart data tables (for screen reader fallback)
- Alert announcements (toast notifications)

### Browser DevTools

#### Chrome/Edge DevTools

```
1. Open DevTools (F12)
2. Elements tab → Accessibility pane
3. Check computed properties, ARIA attributes
4. Run Lighthouse audit (Performance tab)
   - Accessibility score should be 95+
```

#### Firefox DevTools

```
1. Open DevTools (F12)
2. Accessibility tab
3. Check violations and warnings
4. Test keyboard navigation with "Tab" tracking
```

### Automated Testing Tools

#### axe DevTools Extension

Install: [Chrome](https://chrome.google.com/webstore) | [Firefox](https://addons.mozilla.org/firefox)

```
1. Install extension
2. Open example page
3. Open DevTools → axe DevTools tab
4. Click "Scan ALL of my page"
5. Fix any Critical or Serious issues
```

#### Lighthouse CI

```bash
# Run accessibility audit via CLI
npx lighthouse http://localhost:3000/showcase \
  --only-categories=accessibility \
  --output=html \
  --output-path=./lighthouse-report.html
```

Target scores:
- **Accessibility**: 95+ (100 ideal)
- **Best Practices**: 90+
- **Performance**: 90+

## Responsive Testing

Test these breakpoints:

### Mobile
- **320px** - iPhone SE
- **375px** - iPhone 12/13
- **414px** - iPhone 12 Pro Max

### Tablet
- **768px** - iPad
- **1024px** - iPad Pro

### Desktop
- **1280px** - Small laptop
- **1440px** - Standard desktop
- **1920px** - Full HD

### Testing Tools

#### Browser DevTools Device Mode

```
Chrome/Edge:
1. Open DevTools (F12)
2. Click device toggle (Ctrl+Shift+M)
3. Select device or enter custom dimensions

Firefox:
1. Open DevTools (F12)
2. Click responsive design mode (Ctrl+Shift+M)
3. Drag viewport or enter dimensions
```

#### Real Device Testing

Use browser dev server on local network:

```bash
# Start dev server
npm run dev -- --host

# Access from mobile device
# http://<your-ip>:3000
```

## Performance Testing

### Bundle Size Analysis

```bash
# Build the package
npm run build

# Check output sizes
ls -lh dist/

# Analyze bundle composition
npx vite-bundle-visualizer
```

Target sizes:
- **Total bundle**: < 150KB gzipped
- **Individual components**: < 10KB gzipped
- **Tree-shakeable**: Only import what you use

### Runtime Performance

Use React DevTools Profiler:

```
1. Install React DevTools extension
2. Open example page
3. DevTools → Profiler tab
4. Click record, interact with components
5. Stop recording, analyze render times

Targets:
- Initial render: < 100ms
- Interactions: < 16ms (60 FPS)
- Chart updates: < 50ms
```

## Color Contrast Testing

Ensure text meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text).

### Tools

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/)
- Chrome DevTools (Elements → Styles → color picker shows contrast ratio)

### Critical Checks

Dark theme:
- Primary cyan (#00D9D9) on dark background (#0A0A0A)
- Text (#FFFFFF) on dark background
- Muted text (#A0A0A0) on dark background

Glass theme:
- Primary brown (#8B7D6B) on light background (#E5DDD5)
- Text (#3A3A3A) on light background
- Muted text (#666666) on light background

## Known Issues

### Current Limitations

1. **Chart Responsiveness**: Recharts may not resize immediately on window resize
   - **Workaround**: Add window resize listener to force re-render

2. **Tooltip Positioning**: Complex layouts may clip tooltip content
   - **Workaround**: Use `side` and `align` props to adjust positioning

3. **Theme Flash**: Initial page load may show brief theme flash
   - **Workaround**: Add theme class to HTML element via script in `<head>`

## Contributing

When adding new examples:

1. Create a new `.tsx` file in `examples/`
2. Import only from `../src` (not from npm package)
3. Include comprehensive JSDoc comments
4. Add accessibility landmarks (`main`, `nav`, `section`)
5. Test with keyboard and screen reader
6. Update this README with new example description

## Questions?

See main [README.md](../README.md) for component API documentation and installation guide.
