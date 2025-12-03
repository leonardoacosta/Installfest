# Component Documentation

Comprehensive API reference for all components in `@homelab/ui`.

## Table of Contents

- [Navigation](#navigation)
  - [Sidebar](#sidebar)
  - [TopBar](#topbar)
  - [Breadcrumb](#breadcrumb)
- [Forms](#forms)
  - [Button](#button)
  - [Input](#input)
  - [Select](#select)
  - [Checkbox](#checkbox)
  - [Radio Group](#radio-group)
  - [Switch](#switch)
  - [Textarea](#textarea)
- [Data Display](#data-display)
  - [Badge](#badge)
  - [Card](#card)
  - [Table](#table)
  - [Timeline](#timeline)
  - [Avatar](#avatar)
- [Feedback](#feedback)
  - [Alert](#alert)
  - [Toast](#toast)
  - [Progress](#progress)
  - [Skeleton](#skeleton)
  - [EmptyState](#emptystate)
  - [LoadingState](#loadingstate)
  - [ErrorState](#errorstate)
- [Overlay](#overlay)
  - [Dialog](#dialog)
  - [Sheet](#sheet)
  - [Popover](#popover)
  - [Tooltip](#tooltip)
- [Charts](#charts)
  - [ChartContainer](#chartcontainer)
  - [LineChart](#linechart)
  - [BarChart](#barchart)
  - [PieChart](#piechart)
  - [Sparkline](#sparkline)

---

## Navigation

### Sidebar

Collapsible navigation sidebar with icon-only compact mode.

#### Props

```typescript
interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  collapsed?: boolean
  onToggle?: () => void
}
```

#### Sub-components

- `SidebarHeader` - Top section for logo/branding
- `SidebarContent` - Scrollable navigation items
- `SidebarFooter` - Bottom section (typically for toggle)
- `SidebarGroup` - Group of related items with optional label
- `SidebarItem` - Individual navigation link
- `SidebarLogo` - Logo component with auto-sizing
- `SidebarToggle` - Collapse/expand button

#### Example

```tsx
import { Sidebar, SidebarHeader, SidebarContent, SidebarGroup, SidebarItem, SidebarLogo } from '@homelab/ui'
import { Home, Settings } from 'lucide-react'

function AppSidebar() {
  const [collapsed, setCollapsed] = React.useState(false)

  return (
    <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)}>
      <SidebarHeader>
        <SidebarLogo>My App</SidebarLogo>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup label="Main">
          <SidebarItem icon={Home} active>Dashboard</SidebarItem>
          <SidebarItem icon={Settings}>Settings</SidebarItem>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
```

#### Accessibility

- `<nav>` landmark with `aria-label="Main navigation"`
- Keyboard navigation with Tab/Shift+Tab
- Icons have `aria-hidden="true"`, text provides context
- Tooltips shown in collapsed mode via Radix UI Tooltip

---

### TopBar

Header component with search, notifications, and user menu.

#### Sub-components

- `TopBar` - Main container
- `TopBarSearch` - Search input with icon
- `TopBarActions` - Right-aligned action buttons
- `TopBarNotifications` - Notification bell with badge
- `TopBarThemeToggle` - Dark/Glass theme switcher
- `TopBarUser` - User avatar and dropdown menu

#### Example

```tsx
import { TopBar, TopBarSearch, TopBarActions, TopBarThemeToggle, TopBarUser } from '@homelab/ui'

function AppHeader() {
  return (
    <TopBar>
      <TopBarSearch />
      <TopBarActions>
        <TopBarThemeToggle />
        <TopBarUser />
      </TopBarActions>
    </TopBar>
  )
}
```

#### Accessibility

- `<header>` landmark
- Search has `aria-label="Search"`
- Theme toggle announces current/next theme
- Notification bell has `aria-label` with count

---

### Breadcrumb

Hierarchical navigation trail.

#### Props

Composed from Radix UI primitives - see [shadcn/ui breadcrumb docs](https://ui.shadcn.com/docs/components/breadcrumb).

#### Example

```tsx
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@homelab/ui'

function Nav() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Current Page</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
```

#### Accessibility

- Uses `<nav>` with `aria-label="breadcrumb"`
- Current page has `aria-current="page"`
- Separators are `aria-hidden="true"`

---

## Forms

### Button

Versatile button component with multiple variants.

#### Props

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  asChild?: boolean
}
```

#### Example

```tsx
import { Button } from '@homelab/ui'

function Actions() {
  return (
    <div className="flex gap-2">
      <Button>Default</Button>
      <Button variant="destructive">Delete</Button>
      <Button variant="outline">Cancel</Button>
      <Button size="icon"><Icon /></Button>
    </div>
  )
}
```

#### Accessibility

- Semantic `<button>` element
- Disabled state with `aria-disabled`
- Loading state should use `aria-busy="true"`

---

### Input

Text input field with label support.

#### Props

Standard `<input>` props plus:

```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // Inherits all standard HTML input attributes
}
```

#### Example

```tsx
import { Input, Label } from '@homelab/ui'

function LoginForm() {
  return (
    <div className="space-y-2">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" placeholder="you@example.com" />
    </div>
  )
}
```

#### Accessibility

- Always pair with `<Label>` using `htmlFor`
- Use `aria-invalid` and `aria-describedby` for validation errors
- `placeholder` should not replace label

---

### Select

Dropdown selection component (Radix UI Select).

#### Example

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@homelab/ui'

function CategorySelect() {
  return (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Select category" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="cat1">Category 1</SelectItem>
        <SelectItem value="cat2">Category 2</SelectItem>
      </SelectContent>
    </Select>
  )
}
```

#### Accessibility

- Keyboard navigation with Arrow keys
- Type-ahead search by typing letters
- Escape to close dropdown
- Full screen reader support via Radix UI

---

### Checkbox

Checkable input for boolean values.

#### Example

```tsx
import { Checkbox, Label } from '@homelab/ui'

function TermsCheckbox() {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  )
}
```

#### Accessibility

- Uses Radix UI Checkbox (WCAG compliant)
- Space to toggle, Tab to navigate
- `aria-checked` state announced to screen readers

---

### Radio Group

Mutually exclusive selection group.

#### Example

```tsx
import { RadioGroup, RadioGroupItem, Label } from '@homelab/ui'

function PlanSelector() {
  return (
    <RadioGroup defaultValue="free">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="free" id="free" />
        <Label htmlFor="free">Free Plan</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="pro" id="pro" />
        <Label htmlFor="pro">Pro Plan</Label>
      </div>
    </RadioGroup>
  )
}
```

#### Accessibility

- Arrow keys navigate between options
- Space selects option
- `role="radiogroup"` with proper ARIA attributes

---

### Switch

Toggle switch for boolean settings.

#### Example

```tsx
import { Switch, Label } from '@homelab/ui'

function NotificationToggle() {
  return (
    <div className="flex items-center space-x-2">
      <Switch id="notifications" />
      <Label htmlFor="notifications">Enable notifications</Label>
    </div>
  )
}
```

#### Accessibility

- Radix UI Switch with `role="switch"`
- `aria-checked` announces state
- Space to toggle

---

### Textarea

Multi-line text input.

#### Example

```tsx
import { Textarea, Label } from '@homelab/ui'

function FeedbackForm() {
  return (
    <div className="space-y-2">
      <Label htmlFor="feedback">Your feedback</Label>
      <Textarea id="feedback" placeholder="Tell us what you think" rows={5} />
    </div>
  )
}
```

#### Accessibility

- Always pair with `<Label>`
- Use `aria-describedby` for character limits

---

## Data Display

### Badge

Inline status indicator with semantic variants.

#### Props

```typescript
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline'
    | 'success'
    | 'passed'
    | 'failed'
    | 'error'
    | 'running'
    | 'pending'
    | 'skipped'
    | 'canceled'
    | 'in-transit'
    | 'arrived'
    | 'delayed'
}
```

#### Example

```tsx
import { Badge } from '@homelab/ui'

function TestStatus({ status }: { status: string }) {
  return (
    <Badge variant={status === 'pass' ? 'passed' : 'failed'}>
      {status}
    </Badge>
  )
}
```

#### Accessibility

- Use semantic HTML (`<span>`) with appropriate color contrast
- Status should also be conveyed via text, not just color
- Consider adding `aria-label` for icon-only badges

---

### Card

Container component for grouped content.

#### Sub-components

- `Card` - Main container
- `CardHeader` - Top section
- `CardTitle` - Heading
- `CardDescription` - Subtitle
- `CardContent` - Main content area
- `CardFooter` - Bottom section for actions

#### Example

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button } from '@homelab/ui'

function StatsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Total Users</CardTitle>
        <CardDescription>Active users this month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">2,453</div>
      </CardContent>
      <CardFooter>
        <Button variant="outline">View Details</Button>
      </CardFooter>
    </Card>
  )
}
```

#### Accessibility

- Use semantic `<section>` or `<article>` based on content
- CardTitle renders as `<h3>` by default
- Ensure logical heading hierarchy

---

### Table

Data table with header and body sections.

#### Sub-components

- `Table` - Main container
- `TableHeader` - Column headers
- `TableBody` - Data rows
- `TableRow` - Individual row
- `TableHead` - Header cell
- `TableCell` - Data cell

#### Example

```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@homelab/ui'

function UserTable({ users }: { users: User[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map(user => (
          <TableRow key={user.id}>
            <TableCell>{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell><Badge>{user.status}</Badge></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

#### Accessibility

- Semantic `<table>` element
- `<thead>` and `<tbody>` for structure
- Consider `aria-label` for table description
- Add `scope="col"` to `<th>` elements

---

### Timeline

Vertical timeline for event tracking.

#### Props

```typescript
interface TimelineItemProps {
  icon?: LucideIcon
  status?: 'success' | 'error' | 'warning' | 'in-progress' | 'pending'
  title: React.ReactNode
  description?: React.ReactNode
  timestamp?: React.ReactNode
  active?: boolean
  last?: boolean
}
```

#### Example

```tsx
import { Timeline, TimelineItem } from '@homelab/ui'
import { CheckCircle2, Clock } from 'lucide-react'

function OrderTimeline() {
  return (
    <Timeline>
      <TimelineItem
        icon={CheckCircle2}
        status="success"
        title="Order Placed"
        description="Your order has been confirmed"
        timestamp="2 hours ago"
      />
      <TimelineItem
        icon={Clock}
        status="in-progress"
        title="Processing"
        description="Your order is being prepared"
        timestamp="1 hour ago"
        active
      />
      <TimelineItem
        status="pending"
        title="Shipping"
        timestamp="Pending"
        last
      />
    </Timeline>
  )
}
```

#### Accessibility

- Use `<ol>` for ordered list of events
- Each item is `<li>` with proper structure
- Status conveyed via text and icon
- Color is supplementary, not primary indicator

---

### Avatar

User profile picture with fallback.

#### Sub-components

- `Avatar` - Container
- `AvatarImage` - Image element
- `AvatarFallback` - Text or icon fallback

#### Example

```tsx
import { Avatar, AvatarImage, AvatarFallback } from '@homelab/ui'

function UserAvatar({ user }: { user: User }) {
  return (
    <Avatar>
      <AvatarImage src={user.avatar} alt={user.name} />
      <AvatarFallback>{user.initials}</AvatarFallback>
    </Avatar>
  )
}
```

#### Accessibility

- `alt` text on image is essential
- Fallback should use initials or icon
- Consider `aria-label` on container for context

---

## Feedback

### Alert

Prominent notification message.

#### Props

```typescript
interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive'
}
```

#### Example

```tsx
import { Alert, AlertTitle, AlertDescription } from '@homelab/ui'
import { AlertCircle } from 'lucide-react'

function ErrorAlert() {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Something went wrong. Please try again.
      </AlertDescription>
    </Alert>
  )
}
```

#### Accessibility

- Use `role="alert"` for important messages
- Icon + text for redundancy
- Consider live regions for dynamic alerts

---

### Toast

Temporary notification popup.

#### Example

```tsx
import { useToast, Toaster } from '@homelab/ui'

function App() {
  const { toast } = useToast()

  return (
    <>
      <button
        onClick={() => {
          toast({
            title: "Success",
            description: "Your changes have been saved.",
          })
        }}
      >
        Show Toast
      </button>
      <Toaster />
    </>
  )
}
```

#### Accessibility

- Uses Radix UI Toast (WCAG compliant)
- `role="status"` announces to screen readers
- Auto-dismisses after 5 seconds (configurable)
- Swipe to dismiss on mobile

---

### Progress

Progress bar for loading states.

#### Props

```typescript
interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number // 0-100
}
```

#### Example

```tsx
import { Progress } from '@homelab/ui'

function UploadProgress({ percent }: { percent: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Uploading...</span>
        <span>{percent}%</span>
      </div>
      <Progress value={percent} />
    </div>
  )
}
```

#### Accessibility

- Uses `role="progressbar"`
- `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Visual + text for current progress

---

### Skeleton

Loading placeholder with shimmer effect.

#### Example

```tsx
import { Skeleton } from '@homelab/ui'

function LoadingCard() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-3/4" />
      <Skeleton className="h-12 w-1/2" />
    </div>
  )
}
```

#### Accessibility

- Add `aria-label="Loading"` to container
- Don't use as only loading indicator
- Supplement with text for screen readers

---

### EmptyState

Empty state component with icon and action.

#### Props

```typescript
interface EmptyStateProps {
  icon?: LucideIcon
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
}
```

#### Example

```tsx
import { EmptyState, Button } from '@homelab/ui'
import { Package } from 'lucide-react'

function NoItems() {
  return (
    <EmptyState
      icon={Package}
      title="No items found"
      description="Create your first item to get started"
      action={<Button>Create Item</Button>}
    />
  )
}
```

---

### LoadingState

Loading indicator with message.

#### Example

```tsx
import { LoadingState } from '@homelab/ui'

function Loading() {
  return <LoadingState message="Loading your data..." />
}
```

---

### ErrorState

Error state with retry action.

#### Example

```tsx
import { ErrorState, Button } from '@homelab/ui'

function Error({ onRetry }: { onRetry: () => void }) {
  return (
    <ErrorState
      title="Something went wrong"
      description="We couldn't load your data"
      action={<Button onClick={onRetry}>Retry</Button>}
    />
  )
}
```

---

## Overlay

### Dialog

Modal dialog overlay.

#### Example

```tsx
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, Button } from '@homelab/ui'

function ConfirmDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="outline">Cancel</Button>
          <Button variant="destructive">Delete</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

#### Accessibility

- Radix UI Dialog (WCAG compliant)
- Escape to close
- Focus trap within dialog
- `aria-modal="true"`
- Background scroll lock

---

### Sheet

Slide-out panel (drawer).

#### Example

```tsx
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, Button } from '@homelab/ui'

function SettingsSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Settings</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>
        {/* Settings form */}
      </SheetContent>
    </Sheet>
  )
}
```

#### Accessibility

- Same as Dialog (Radix UI)
- Side can be `top`, `right`, `bottom`, `left`

---

### Popover

Floating content overlay.

#### Example

```tsx
import { Popover, PopoverTrigger, PopoverContent, Button } from '@homelab/ui'

function HelpPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost">Help</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-2">
          <h4 className="font-medium">Need help?</h4>
          <p className="text-sm">Contact support for assistance.</p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

#### Accessibility

- Radix UI Popover
- Escape to close
- Focus returns to trigger

---

### Tooltip

Hover/focus informational popup.

#### Example

```tsx
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent, Button } from '@homelab/ui'

function IconButton() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon"><Icon /></Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Settings</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
```

#### Accessibility

- Radix UI Tooltip
- Shows on hover and focus
- `aria-describedby` links tooltip to trigger
- Not for essential information

---

## Charts

### ChartContainer

Responsive wrapper for Recharts with theme integration.

#### Props

```typescript
interface ChartContainerProps {
  title?: React.ReactNode
  description?: React.ReactNode
  height?: number | string
  aspect?: number
  className?: string
  children: React.ReactNode
}
```

#### Example

```tsx
import { ChartContainer } from '@homelab/ui'
import { LineChart, Line } from 'recharts'

function Chart() {
  return (
    <ChartContainer title="Revenue" description="Monthly revenue" height={300}>
      <LineChart data={data}>
        <Line dataKey="revenue" stroke="#00D9D9" />
      </LineChart>
    </ChartContainer>
  )
}
```

---

### LineChart

Line and area chart wrappers.

#### Props

```typescript
interface SimpleLineChartProps {
  data: any[]
  dataKey: string
  xAxisKey: string
  title?: React.ReactNode
  description?: React.ReactNode
  height?: number
  showGrid?: boolean
  showLegend?: boolean
  showTooltip?: boolean
  colors?: string[]
  strokeWidth?: number
  dot?: boolean
  className?: string
}
```

#### Example

```tsx
import { SimpleLineChart, AreaLineChart } from '@homelab/ui'

const data = [
  { month: 'Jan', revenue: 4000 },
  { month: 'Feb', revenue: 3000 },
  { month: 'Mar', revenue: 6000 },
]

function RevenueChart() {
  return (
    <SimpleLineChart
      data={data}
      dataKey="revenue"
      xAxisKey="month"
      title="Revenue Trend"
      height={300}
    />
  )
}

function AreaChart() {
  return (
    <AreaLineChart
      data={data}
      dataKey="revenue"
      xAxisKey="month"
      fillOpacity={0.3}
    />
  )
}
```

---

### BarChart

Vertical and horizontal bar charts.

#### Props

```typescript
interface SimpleBarChartProps {
  data: any[]
  dataKey: string
  xAxisKey: string
  horizontal?: boolean
  stacked?: boolean
  // ... same as LineChart
}
```

#### Example

```tsx
import { SimpleBarChart } from '@homelab/ui'

function CategoryChart() {
  return (
    <SimpleBarChart
      data={data}
      dataKey="value"
      xAxisKey="category"
      height={300}
    />
  )
}
```

---

### PieChart

Pie and donut charts.

#### Props

```typescript
interface SimplePieChartProps {
  data: any[]
  dataKey: string
  nameKey: string
  donut?: boolean
  innerRadius?: number
  outerRadius?: number
  showLabels?: boolean
  // ...
}

interface DonutChartProps extends SimplePieChartProps {
  centerLabel?: React.ReactNode
  centerValue?: React.ReactNode
}
```

#### Example

```tsx
import { SimplePieChart, DonutChart } from '@homelab/ui'

const data = [
  { name: 'Desktop', value: 400 },
  { name: 'Mobile', value: 300 },
  { name: 'Tablet', value: 200 },
]

function DeviceChart() {
  return (
    <DonutChart
      data={data}
      dataKey="value"
      nameKey="name"
      centerLabel="Total"
      centerValue="900"
    />
  )
}
```

---

### Sparkline

Inline mini charts for trends.

#### Props

```typescript
interface SparklineProps {
  data: any[]
  dataKey: string
  trend?: 'up' | 'down' | 'neutral'
  showTrend?: boolean
  height?: number
}
```

#### Example

```tsx
import { Sparkline, Sparkbar } from '@homelab/ui'

const data = [
  { value: 10 },
  { value: 20 },
  { value: 15 },
  { value: 30 },
]

function MetricCard() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-2xl font-bold">$12,345</div>
        <div className="text-sm text-muted-foreground">Revenue</div>
      </div>
      <Sparkline data={data} dataKey="value" trend="up" showTrend />
    </div>
  )
}
```

---

## Theme System

All components support Dark Professional and Glassmorphism themes.

### Using the Theme Provider

```tsx
import { ThemeProvider } from '@homelab/ui'

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      {/* Your app */}
    </ThemeProvider>
  )
}
```

### Theme Toggle

```tsx
import { useTheme } from '@homelab/ui'

function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'glass' : 'dark')}>
      Toggle Theme
    </button>
  )
}
```

### Custom Chart Colors

```tsx
import { useChartTheme } from '@homelab/ui'

function CustomChart() {
  const colors = useChartTheme()

  // colors.primary, colors.secondary, colors.success, etc.
}
```

---

## TypeScript Support

All components are fully typed with TypeScript. Import types as needed:

```typescript
import type { ButtonProps, BadgeProps } from '@homelab/ui'
```

---

## Further Reading

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Radix UI Documentation](https://www.radix-ui.com)
- [Recharts Documentation](https://recharts.org)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
