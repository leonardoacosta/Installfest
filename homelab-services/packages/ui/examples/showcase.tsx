/**
 * Component Showcase
 *
 * Comprehensive example page demonstrating all components from the UI library.
 * Use this for visual testing, accessibility audits, and responsive design validation.
 */

import * as React from "react"
import {
  // Layout
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Separator,

  // Navigation
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarToggle,
  SidebarGroup,
  SidebarItem,
  SidebarLogo,
  TopBar,
  TopBarSearch,
  TopBarActions,
  TopBarNotifications,
  TopBarThemeToggle,
  TopBarUser,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,

  // Forms
  Button,
  Input,
  Label,
  Checkbox,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,

  // Data Display
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Timeline,
  TimelineItem,

  // Feedback
  Alert,
  AlertDescription,
  AlertTitle,
  Progress,
  Skeleton,
  EmptyState,
  LoadingState,
  ErrorState,
  Toaster,
  useToast,

  // Overlay
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,

  // Charts
  ChartContainer,
  SimpleLineChart,
  AreaLineChart,
  SimpleBarChart,
  SimplePieChart,
  DonutChart,
  Sparkline,
  Sparkbar,
} from "../src"

import {
  Home,
  Package,
  Users,
  Settings,
  Bell,
  Search,
  User,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react"

export function ComponentShowcase() {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const { toast } = useToast()

  // Sample data for charts
  const lineChartData = [
    { month: "Jan", value: 400 },
    { month: "Feb", value: 300 },
    { month: "Mar", value: 600 },
    { month: "Apr", value: 800 },
    { month: "May", value: 500 },
    { month: "Jun", value: 700 },
  ]

  const barChartData = [
    { category: "A", value: 400 },
    { category: "B", value: 300 },
    { category: "C", value: 600 },
    { category: "D", value: 800 },
  ]

  const pieChartData = [
    { name: "Desktop", value: 400 },
    { name: "Mobile", value: 300 },
    { name: "Tablet", value: 200 },
  ]

  const sparklineData = [
    { value: 10 },
    { value: 20 },
    { value: 15 },
    { value: 30 },
    { value: 25 },
    { value: 40 },
  ]

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}>
        <SidebarHeader>
          <SidebarLogo>UI Library</SidebarLogo>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup label="Main">
            <SidebarItem icon={Home} active>
              Dashboard
            </SidebarItem>
            <SidebarItem icon={Package}>
              Components
            </SidebarItem>
            <SidebarItem icon={Users}>
              Examples
            </SidebarItem>
          </SidebarGroup>

          <SidebarGroup label="Settings">
            <SidebarItem icon={Settings}>
              Preferences
            </SidebarItem>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarToggle />
        </SidebarFooter>
      </Sidebar>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* TopBar */}
        <TopBar>
          <TopBarSearch />
          <TopBarActions>
            <TopBarNotifications />
            <TopBarThemeToggle />
            <TopBarUser />
          </TopBarActions>
        </TopBar>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          {/* Breadcrumbs */}
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/components">Components</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Showcase</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="space-y-8">
            {/* Buttons Section */}
            <Card>
              <CardHeader>
                <CardTitle>Buttons</CardTitle>
                <CardDescription>Different button variants and sizes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button>Default</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                </div>
                <Separator />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon"><Settings className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>

            {/* Badges Section */}
            <Card>
              <CardHeader>
                <CardTitle>Badges</CardTitle>
                <CardDescription>Status indicators with variants</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="passed">Passed</Badge>
                  <Badge variant="failed">Failed</Badge>
                  <Badge variant="running">Running</Badge>
                  <Badge variant="pending">Pending</Badge>
                  <Badge variant="skipped">Skipped</Badge>
                  <Badge variant="in-transit">In Transit</Badge>
                  <Badge variant="arrived">Arrived</Badge>
                  <Badge variant="delayed">Delayed</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Forms Section */}
            <Card>
              <CardHeader>
                <CardTitle>Form Controls</CardTitle>
                <CardDescription>Input fields and form elements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="Enter your email" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" placeholder="Enter your message" />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="terms" />
                  <Label htmlFor="terms">Accept terms and conditions</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="notifications" />
                  <Label htmlFor="notifications">Enable notifications</Label>
                </div>

                <div className="space-y-2">
                  <Label>Select Option</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="option1">Option 1</SelectItem>
                      <SelectItem value="option2">Option 2</SelectItem>
                      <SelectItem value="option3">Option 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Radio Group</Label>
                  <RadioGroup defaultValue="option1">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="option1" id="r1" />
                      <Label htmlFor="r1">Option 1</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="option2" id="r2" />
                      <Label htmlFor="r2">Option 2</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            {/* Alerts Section */}
            <Card>
              <CardHeader>
                <CardTitle>Alerts</CardTitle>
                <CardDescription>Notification messages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Information</AlertTitle>
                  <AlertDescription>
                    This is an informational alert message.
                  </AlertDescription>
                </Alert>

                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Something went wrong. Please try again.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Timeline Section */}
            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
                <CardDescription>Event tracking timeline</CardDescription>
              </CardHeader>
              <CardContent>
                <Timeline>
                  <TimelineItem
                    icon={CheckCircle2}
                    status="success"
                    title="Order Placed"
                    description="Your order has been successfully placed"
                    timestamp="2 hours ago"
                  />
                  <TimelineItem
                    icon={Package}
                    status="in-progress"
                    title="Processing"
                    description="Your order is being prepared"
                    timestamp="1 hour ago"
                    active
                  />
                  <TimelineItem
                    icon={Clock}
                    status="pending"
                    title="Shipping"
                    description="Your order will be shipped soon"
                    timestamp="Pending"
                  />
                  <TimelineItem
                    icon={Home}
                    status="pending"
                    title="Delivered"
                    description="Order will be delivered to your address"
                    timestamp="Pending"
                    last
                  />
                </Timeline>
              </CardContent>
            </Card>

            {/* State Components Section */}
            <Card>
              <CardHeader>
                <CardTitle>State Components</CardTitle>
                <CardDescription>Empty, loading, and error states</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <EmptyState
                  icon={Package}
                  title="No items found"
                  description="You don't have any items yet. Create your first item to get started."
                  action={<Button>Create Item</Button>}
                />

                <Separator />

                <LoadingState message="Loading your data..." />

                <Separator />

                <ErrorState
                  title="Something went wrong"
                  description="We couldn't load your data. Please try again."
                  action={<Button>Retry</Button>}
                />
              </CardContent>
            </Card>

            {/* Charts Section */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Line Chart</CardTitle>
                  <CardDescription>Monthly revenue trend</CardDescription>
                </CardHeader>
                <CardContent>
                  <SimpleLineChart
                    data={lineChartData}
                    dataKey="value"
                    xAxisKey="month"
                    height={250}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Area Chart</CardTitle>
                  <CardDescription>Traffic over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <AreaLineChart
                    data={lineChartData}
                    dataKey="value"
                    xAxisKey="month"
                    height={250}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Bar Chart</CardTitle>
                  <CardDescription>Category comparison</CardDescription>
                </CardHeader>
                <CardContent>
                  <SimpleBarChart
                    data={barChartData}
                    dataKey="value"
                    xAxisKey="category"
                    height={250}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Donut Chart</CardTitle>
                  <CardDescription>Traffic by device</CardDescription>
                </CardHeader>
                <CardContent>
                  <DonutChart
                    data={pieChartData}
                    dataKey="value"
                    nameKey="name"
                    height={250}
                    centerLabel="Total"
                    centerValue="900"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Sparklines Section */}
            <Card>
              <CardHeader>
                <CardTitle>Sparklines</CardTitle>
                <CardDescription>Inline mini charts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Revenue</span>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                    <Sparkline data={sparklineData} dataKey="value" trend="up" showTrend />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Expenses</span>
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    </div>
                    <Sparkline data={sparklineData} dataKey="value" trend="down" showTrend />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Profit</span>
                      <Minus className="h-4 w-4 text-gray-500" />
                    </div>
                    <Sparkline data={sparklineData} dataKey="value" trend="neutral" showTrend />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Table Section */}
            <Card>
              <CardHeader>
                <CardTitle>Data Table</CardTitle>
                <CardDescription>Tabular data display</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Item 1</TableCell>
                      <TableCell><Badge variant="success">Active</Badge></TableCell>
                      <TableCell>$250</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Item 2</TableCell>
                      <TableCell><Badge variant="pending">Pending</Badge></TableCell>
                      <TableCell>$150</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Item 3</TableCell>
                      <TableCell><Badge variant="failed">Failed</Badge></TableCell>
                      <TableCell>$350</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Dialogs and Overlays Section */}
            <Card>
              <CardHeader>
                <CardTitle>Overlays</CardTitle>
                <CardDescription>Dialogs, sheets, popovers, and tooltips</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>Open Dialog</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Dialog Title</DialogTitle>
                        <DialogDescription>
                          This is a dialog description. You can put any content here.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <p>Dialog content goes here.</p>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline">Open Sheet</Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>Sheet Title</SheetTitle>
                        <SheetDescription>
                          This is a sheet description.
                        </SheetDescription>
                      </SheetHeader>
                      <div className="py-4">
                        <p>Sheet content goes here.</p>
                      </div>
                    </SheetContent>
                  </Sheet>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline">Open Popover</Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <div className="space-y-2">
                        <h4 className="font-medium">Popover</h4>
                        <p className="text-sm text-muted-foreground">
                          This is a popover with some content.
                        </p>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline">Hover for Tooltip</Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>This is a tooltip</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <Button
                    onClick={() => {
                      toast({
                        title: "Notification",
                        description: "This is a toast notification",
                      })
                    }}
                  >
                    Show Toast
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Progress and Skeleton Section */}
            <Card>
              <CardHeader>
                <CardTitle>Loading Indicators</CardTitle>
                <CardDescription>Progress bars and skeleton loaders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Progress: 60%</Label>
                  <Progress value={60} />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-3/4" />
                  <Skeleton className="h-12 w-1/2" />
                </div>
              </CardContent>
            </Card>

            {/* Avatar Section */}
            <Card>
              <CardHeader>
                <CardTitle>Avatars</CardTitle>
                <CardDescription>User profile pictures</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Avatar>
                    <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <Avatar>
                    <AvatarFallback>AB</AvatarFallback>
                  </Avatar>
                  <Avatar>
                    <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <Toaster />
    </div>
  )
}

export default ComponentShowcase
