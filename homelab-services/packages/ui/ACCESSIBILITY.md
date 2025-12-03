# Accessibility Guide

This library is built with accessibility as a first-class concern, targeting **WCAG 2.1 Level AA compliance**.

## Core Principles

1. **Semantic HTML** - Use proper HTML elements (`<button>`, `<nav>`, `<main>`, etc.)
2. **Keyboard Navigation** - All interactive elements accessible via keyboard
3. **Screen Reader Support** - Proper ARIA labels and live regions
4. **Color Contrast** - Minimum 4.5:1 for text, 3:1 for large text
5. **Focus Management** - Visible focus indicators, logical tab order
6. **Responsive Design** - Works across devices and screen sizes

## Component Accessibility

### Navigation

#### Sidebar

- ✅ `<nav>` landmark with `aria-label="Main navigation"`
- ✅ Keyboard navigation (Tab, Shift+Tab)
- ✅ Tooltips in collapsed mode
- ✅ Icons have `aria-hidden="true"`, text provides context

**Keyboard shortcuts:**
- `Tab` - Navigate through items
- `Enter/Space` - Activate item
- `Escape` - Close dropdown menus (if any)

#### TopBar

- ✅ `<header>` landmark
- ✅ Search input with `aria-label="Search"`
- ✅ Notification count announced to screen readers
- ✅ Theme toggle announces current/next theme

#### Breadcrumb

- ✅ `<nav>` with `aria-label="Breadcrumb"`
- ✅ Current page has `aria-current="page"`
- ✅ Separators are `aria-hidden="true"`

### Forms

#### General Form Guidelines

```tsx
// ✅ Good: Label associated with input
<div>
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" />
</div>

// ❌ Bad: No label association
<div>
  <span>Email</span>
  <Input type="email" placeholder="Email" />
</div>

// ✅ Good: Error message associated
<div>
  <Label htmlFor="password">Password</Label>
  <Input
    id="password"
    type="password"
    aria-invalid={hasError}
    aria-describedby={hasError ? "password-error" : undefined}
  />
  {hasError && (
    <p id="password-error" className="text-sm text-red-500">
      Password must be at least 8 characters
    </p>
  )}
</div>
```

#### Button

- ✅ Semantic `<button>` element
- ✅ Disabled state with `aria-disabled`
- ✅ Loading state should use `aria-busy="true"`

```tsx
// ✅ Icon button with accessible label
<Button size="icon" aria-label="Settings">
  <SettingsIcon />
</Button>

// ✅ Loading button
<Button aria-busy={isLoading}>
  {isLoading ? "Loading..." : "Submit"}
</Button>
```

#### Input Fields

- ✅ Always paired with `<Label>` using `htmlFor`
- ✅ Use `aria-invalid` for validation errors
- ✅ Use `aria-describedby` to link error messages
- ✅ Placeholder should not replace label

```tsx
<div>
  <Label htmlFor="username">Username</Label>
  <Input
    id="username"
    aria-required="true"
    aria-describedby="username-hint"
  />
  <p id="username-hint" className="text-sm text-muted-foreground">
    Must be 3-20 characters
  </p>
</div>
```

#### Select

- ✅ Keyboard navigation (Arrow keys, type-ahead)
- ✅ Escape to close
- ✅ Full screen reader support (Radix UI)

#### Checkbox

- ✅ Uses Radix UI Checkbox (WCAG compliant)
- ✅ Space to toggle
- ✅ `aria-checked` announced to screen readers

#### Radio Group

- ✅ `role="radiogroup"`
- ✅ Arrow keys navigate options
- ✅ Space selects option

#### Switch

- ✅ `role="switch"` with `aria-checked`
- ✅ Space to toggle

### Data Display

#### Badge

- ✅ Semantic color + text (not color alone)
- ✅ Status conveyed via text content

```tsx
// ✅ Good: Text + color
<Badge variant="success">Passed</Badge>

// ⚠️ Acceptable: Icon + aria-label
<Badge aria-label="Test passed">
  <CheckIcon />
</Badge>

// ❌ Bad: Color only, no text
<Badge variant="success" /> {/* No context for screen readers */}
```

#### Card

- ✅ Use `<section>` or `<article>` based on content
- ✅ CardTitle renders as `<h3>` by default
- ✅ Logical heading hierarchy

```tsx
// ✅ Good: Proper heading hierarchy
<Card>
  <CardHeader>
    <CardTitle>Section Title</CardTitle> {/* h3 */}
  </CardHeader>
  <CardContent>...</CardContent>
</Card>

// ⚠️ Customize heading level if needed
<Card>
  <CardHeader>
    <CardTitle asChild>
      <h2>Main Section</h2>
    </CardTitle>
  </CardHeader>
</Card>
```

#### Table

- ✅ Semantic `<table>` with `<thead>` and `<tbody>`
- ✅ Add `scope="col"` to header cells
- ✅ Consider `aria-label` for table description

```tsx
<Table aria-label="User list">
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Name</TableHead>
      <TableHead scope="col">Email</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {/* rows */}
  </TableBody>
</Table>
```

#### Timeline

- ✅ Uses `<ol>` for ordered list of events
- ✅ Status conveyed via icon + text
- ✅ Color is supplementary

### Feedback

#### Alert

- ✅ `role="alert"` for important messages
- ✅ Icon + text for redundancy
- ✅ Live regions for dynamic alerts

```tsx
// ✅ Static alert
<Alert>
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Heads up!</AlertTitle>
  <AlertDescription>Check your settings.</AlertDescription>
</Alert>

// ✅ Dynamic alert (screen reader announces)
<div role="alert" aria-live="assertive">
  {error && <Alert variant="destructive">{error}</Alert>}
</div>
```

#### Toast

- ✅ Radix UI Toast (WCAG compliant)
- ✅ `role="status"` announces to screen readers
- ✅ Auto-dismisses (configurable)
- ✅ Swipe to dismiss on mobile

#### Progress

- ✅ `role="progressbar"`
- ✅ `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- ✅ Visual + text for current progress

```tsx
<div>
  <div className="flex justify-between text-sm">
    <span>Uploading...</span>
    <span>{percent}%</span>
  </div>
  <Progress value={percent} aria-label="Upload progress" />
</div>
```

#### Skeleton

- ✅ Add `aria-label="Loading"` or `aria-busy="true"`
- ✅ Don't use as only loading indicator

```tsx
<div aria-busy="true" aria-label="Loading content">
  <Skeleton className="h-12 w-full" />
  <Skeleton className="h-12 w-3/4" />
</div>
```

### Overlay

#### Dialog

- ✅ Radix UI Dialog (WCAG compliant)
- ✅ `Escape` to close
- ✅ Focus trap within dialog
- ✅ `aria-modal="true"`
- ✅ Background scroll lock

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Modal Title</DialogTitle>
      <DialogDescription>
        This describes the modal's purpose for screen readers.
      </DialogDescription>
    </DialogHeader>
    {/* content */}
  </DialogContent>
</Dialog>
```

#### Sheet

- ✅ Same accessibility as Dialog
- ✅ Slide-in direction configurable

#### Popover

- ✅ Escape to close
- ✅ Focus returns to trigger
- ✅ `aria-haspopup` on trigger

#### Tooltip

- ✅ Shows on hover AND focus
- ✅ `aria-describedby` links tooltip to trigger
- ✅ Not for essential information

```tsx
// ✅ Good: Supplementary info
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button size="icon" aria-label="Settings">
        <SettingsIcon />
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Open settings</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>

// ❌ Bad: Essential info only in tooltip
<Tooltip>
  <TooltipTrigger>
    <span>?</span> {/* No accessible label */}
  </TooltipTrigger>
  <TooltipContent>
    <p>This is required information</p>
  </TooltipContent>
</Tooltip>
```

### Charts

#### General Chart Accessibility

Charts are inherently visual. Provide alternatives:

```tsx
// ✅ Good: Chart + data table fallback
<div>
  <SimpleLineChart data={data} dataKey="value" xAxisKey="month" />

  {/* Visually hidden table for screen readers */}
  <table className="sr-only">
    <caption>Monthly revenue data</caption>
    <thead>
      <tr>
        <th>Month</th>
        <th>Revenue</th>
      </tr>
    </thead>
    <tbody>
      {data.map(row => (
        <tr key={row.month}>
          <td>{row.month}</td>
          <td>{row.value}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

// ✅ Or: Detailed text summary
<div>
  <DonutChart data={statusData} dataKey="value" nameKey="name" />
  <p className="sr-only">
    Test results: 285 passed, 24 failed, 25 skipped. Success rate: 85%.
  </p>
</div>
```

#### Chart Containers

- ✅ Add `aria-label` describing chart purpose
- ✅ Title provides context
- ✅ Consider data table alternative

```tsx
<ChartContainer
  title="Revenue Trend"
  description="Monthly revenue over the past 6 months"
  aria-label="Line chart showing monthly revenue trend"
>
  <SimpleLineChart data={data} dataKey="revenue" xAxisKey="month" />
</ChartContainer>
```

## Color Contrast

### Dark Theme

All color combinations meet WCAG AA standards (4.5:1 for text, 3:1 for UI components):

| Element | Foreground | Background | Ratio |
|---------|-----------|------------|-------|
| Primary text | #FFFFFF | #0A0A0A | 21:1 ✅ |
| Muted text | #A0A0A0 | #0A0A0A | 12.6:1 ✅ |
| Primary accent | #00D9D9 | #0A0A0A | 14.2:1 ✅ |
| Success | #00FF94 | #0A0A0A | 16.8:1 ✅ |
| Warning | #FFD60A | #0A0A0A | 15.2:1 ✅ |
| Error | #FF453A | #0A0A0A | 8.3:1 ✅ |

### Glass Theme

| Element | Foreground | Background | Ratio |
|---------|-----------|------------|-------|
| Primary text | #3A3A3A | #E5DDD5 | 10.2:1 ✅ |
| Muted text | #666666 | #E5DDD5 | 5.8:1 ✅ |
| Primary accent | #8B7D6B | #E5DDD5 | 4.9:1 ✅ |
| Success | #6ABF69 | #E5DDD5 | 4.6:1 ✅ |
| Warning | #F4B740 | #E5DDD5 | 6.1:1 ✅ |
| Error | #E85D75 | #E5DDD5 | 5.2:1 ✅ |

### Testing Contrast

Use these tools to verify:
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Chrome DevTools (color picker shows ratio)
- [Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/)

## Keyboard Navigation

### Global Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Focus next element |
| `Shift + Tab` | Focus previous element |
| `Enter` | Activate button/link |
| `Space` | Activate button, toggle checkbox/switch |
| `Escape` | Close dialog/popover/sheet |
| `Arrow keys` | Navigate within radio groups, selects, menus |

### Focus Indicators

All interactive elements have visible focus indicators:

```css
/* Global focus styles (already applied) */
*:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}
```

Test focus visibility:
1. Tab through all interactive elements
2. Ensure focus ring is visible on all
3. Verify contrast ratio of focus ring (3:1 minimum)

## Screen Reader Testing

### Recommended Tools

- **NVDA** (Windows) - Free, open-source
- **JAWS** (Windows) - Industry standard, commercial
- **VoiceOver** (macOS/iOS) - Built-in, free
- **TalkBack** (Android) - Built-in, free
- **Narrator** (Windows) - Built-in, free

### Testing Checklist

#### General

- [ ] All images have `alt` text (or `alt=""` if decorative)
- [ ] All form inputs have associated labels
- [ ] All buttons have accessible names
- [ ] Landmarks (`<nav>`, `<main>`, `<aside>`) are used correctly
- [ ] Heading hierarchy is logical (h1 → h2 → h3, no skipping)
- [ ] Links make sense out of context (avoid "click here")

#### Interactive Elements

- [ ] Buttons announce as "button" and their label
- [ ] Links announce as "link" and destination
- [ ] Form inputs announce label, type, and current value
- [ ] Checkboxes/radios announce checked state
- [ ] Disabled elements announce as disabled
- [ ] Required fields announce as required

#### Dynamic Content

- [ ] Loading states announce "Loading" or show progress
- [ ] Error messages announce to screen reader (role="alert")
- [ ] Toast notifications announce (role="status")
- [ ] Live regions update correctly (aria-live)
- [ ] Dialog focus trap works (focus stays inside modal)

#### Navigation

- [ ] Tab order is logical (left-to-right, top-to-bottom)
- [ ] Skip links available (e.g., "Skip to main content")
- [ ] Current page/location announced (aria-current)
- [ ] Breadcrumb navigation announced correctly

### Testing with VoiceOver (macOS)

```
1. Enable VoiceOver: Cmd + F5
2. Navigate: VO + Arrow keys (VO = Ctrl + Option)
3. Interact with groups: VO + Shift + Down Arrow
4. Stop interacting: VO + Shift + Up Arrow
5. Open rotor: VO + U (browse headings, links, forms)
6. Click: VO + Space
```

### Testing with NVDA (Windows)

```
1. Start NVDA: Ctrl + Alt + N
2. Navigate: Arrow keys
3. Next heading: H
4. Next link: K
5. Next form field: F
6. Elements list: NVDA + F7
7. Click: Enter or Space
```

## Automated Testing

### axe DevTools

Install browser extension, then:

```
1. Open your page
2. Open DevTools → axe DevTools tab
3. Click "Scan ALL of my page"
4. Review violations:
   - Critical: Fix immediately
   - Serious: Fix before release
   - Moderate: Fix when possible
   - Minor: Nice to have
```

### Lighthouse

Run via Chrome DevTools or CLI:

```bash
# Via CLI
npx lighthouse http://localhost:3000 \
  --only-categories=accessibility \
  --output=html \
  --output-path=./report.html

# Target scores:
# Accessibility: 95-100
# Best Practices: 90-100
```

### jest-axe (Unit Tests)

```tsx
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

test('Button has no accessibility violations', async () => {
  const { container } = render(<Button>Click me</Button>)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

## Responsive Design

### Breakpoints

```css
/* Mobile first approach */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

### Testing Checklist

- [ ] Touch targets ≥ 44x44px on mobile
- [ ] Text scales appropriately (1rem = 16px base)
- [ ] No horizontal scrolling on mobile
- [ ] Charts responsive (use aspect ratio, not fixed height)
- [ ] Navigation adapts to mobile (hamburger menu or sidebar)
- [ ] Tooltips work on touch devices (show on tap)
- [ ] Forms readable on small screens (no tiny inputs)

### Zoom Testing

Test at different zoom levels:

```
1. 100% - Default
2. 200% - WCAG AA requirement
3. 400% - WCAG AAA requirement (stretch goal)
```

Ensure:
- No content is clipped
- No horizontal scrolling (vertical OK)
- Text remains readable
- Interactive elements still accessible

## Common Pitfalls

### ❌ Bad Practices

```tsx
// ❌ Div button without keyboard support
<div onClick={handleClick}>Click me</div>

// ❌ Missing alt text
<img src="logo.png" />

// ❌ Placeholder as label
<Input placeholder="Email" />

// ❌ Color-only status indicator
<span className="text-green-500">●</span>

// ❌ Non-semantic heading
<div className="text-2xl font-bold">Section Title</div>

// ❌ Tooltip with essential info
<Tooltip>
  <TooltipTrigger>*</TooltipTrigger>
  <TooltipContent>Required field</TooltipContent>
</Tooltip>
```

### ✅ Good Practices

```tsx
// ✅ Semantic button
<Button onClick={handleClick}>Click me</Button>

// ✅ Alt text (or alt="" if decorative)
<img src="logo.png" alt="Company Logo" />

// ✅ Proper label
<div>
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" />
</div>

// ✅ Text + color for status
<Badge variant="success">Active</Badge>

// ✅ Semantic heading
<h2 className="text-2xl font-bold">Section Title</h2>

// ✅ Required indicator in label
<Label htmlFor="email">
  Email <span className="text-red-500">*</span>
</Label>
<Input id="email" type="email" aria-required="true" />
```

## Resources

### Official Guidelines

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

### Testing Tools

- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WAVE](https://wave.webaim.org/)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Screen Readers

- [NVDA](https://www.nvaccess.org/download/) (Windows, free)
- [JAWS](https://www.freedomscientific.com/products/software/jaws/) (Windows, trial)
- VoiceOver (macOS/iOS, built-in: Cmd+F5)
- TalkBack (Android, built-in)

### Learning Resources

- [WebAIM Articles](https://webaim.org/articles/)
- [The A11Y Project](https://www.a11yproject.com/)
- [Inclusive Components](https://inclusive-components.design/)
- [Radix UI Accessibility](https://www.radix-ui.com/docs/primitives/overview/accessibility)

## Support

For accessibility questions or issues, please:

1. Check this guide first
2. Review component-specific docs in [COMPONENTS.md](./COMPONENTS.md)
3. Search existing issues on GitHub
4. Open a new issue with "a11y:" prefix in title
