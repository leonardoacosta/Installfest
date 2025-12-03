/**
 * Sidebar Navigation Component
 *
 * A collapsible sidebar with icon-only and full modes,
 * active route highlighting, and navigation groups.
 *
 * @example
 * ```tsx
 * <Sidebar collapsed={isCollapsed} onToggle={setIsCollapsed}>
 *   <SidebarHeader>
 *     <SidebarLogo src="/logo.svg" alt="Logo" />
 *   </SidebarHeader>
 *
 *   <SidebarContent>
 *     <SidebarGroup label="Main">
 *       <SidebarItem icon={Home} href="/" active>
 *         Dashboard
 *       </SidebarItem>
 *       <SidebarItem icon={FileText} href="/reports">
 *         Reports
 *       </SidebarItem>
 *     </SidebarGroup>
 *
 *     <SidebarGroup label="Settings">
 *       <SidebarItem icon={Settings} href="/settings">
 *         Settings
 *       </SidebarItem>
 *     </SidebarGroup>
 *   </SidebarContent>
 *
 *   <SidebarFooter>
 *     <SidebarItem icon={User} href="/profile">
 *       Profile
 *     </SidebarItem>
 *   </SidebarFooter>
 * </Sidebar>
 * ```
 */

import * as React from "react"
import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SidebarContextValue {
  collapsed: boolean
  onToggle?: () => void
}

const SidebarContext = React.createContext<SidebarContextValue>({
  collapsed: false,
})

export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  collapsed?: boolean
  onToggle?: () => void
}

export function Sidebar({
  collapsed = false,
  onToggle,
  className,
  children,
  ...props
}: SidebarProps) {
  return (
    <SidebarContext.Provider value={{ collapsed, onToggle }}>
      <aside
        className={cn(
          "flex h-full flex-col border-r bg-background transition-all duration-300",
          collapsed ? "w-16" : "w-64",
          className
        )}
        {...props}
      >
        {children}
      </aside>
    </SidebarContext.Provider>
  )
}

export function SidebarHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { collapsed } = React.useContext(SidebarContext)

  return (
    <div
      className={cn(
        "flex h-16 items-center border-b px-4",
        collapsed && "justify-center px-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function SidebarContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex-1 overflow-auto py-4", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function SidebarFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { collapsed } = React.useContext(SidebarContext)

  return (
    <div
      className={cn(
        "border-t p-4",
        collapsed && "px-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function SidebarToggle({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { collapsed, onToggle } = React.useContext(SidebarContext)

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-8 w-8", className)}
      onClick={onToggle}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      {...props}
    >
      {collapsed ? (
        <ChevronRight className="h-4 w-4" />
      ) : (
        <ChevronLeft className="h-4 w-4" />
      )}
    </Button>
  )
}

export interface SidebarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string
}

export function SidebarGroup({
  label,
  className,
  children,
  ...props
}: SidebarGroupProps) {
  const { collapsed } = React.useContext(SidebarContext)

  return (
    <div className={cn("mb-4", className)} {...props}>
      {label && !collapsed && (
        <div className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
      )}
      <div className="space-y-1">{children}</div>
    </div>
  )
}

export interface SidebarItemProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  icon?: LucideIcon
  active?: boolean
  badge?: string | number
}

export function SidebarItem({
  icon: Icon,
  active = false,
  badge,
  className,
  children,
  ...props
}: SidebarItemProps) {
  const { collapsed } = React.useContext(SidebarContext)

  const content = (
    <a
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-foreground hover:bg-accent hover:text-accent-foreground",
        collapsed && "justify-center px-2",
        className
      )}
      {...props}
    >
      {Icon && <Icon className={cn("h-5 w-5 shrink-0", collapsed && "h-6 w-6")} />}
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{children}</span>
          {badge !== undefined && (
            <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs">
              {badge}
            </span>
          )}
        </>
      )}
    </a>
  )

  if (collapsed && children) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right">
            <p>{children}</p>
            {badge !== undefined && <span className="ml-2 text-xs opacity-70">({badge})</span>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return content
}

export interface SidebarLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  collapsedSrc?: string
}

export function SidebarLogo({
  src,
  collapsedSrc,
  alt,
  className,
  ...props
}: SidebarLogoProps) {
  const { collapsed } = React.useContext(SidebarContext)

  return (
    <img
      src={collapsed && collapsedSrc ? collapsedSrc : src}
      alt={alt}
      className={cn(
        "h-8 object-contain transition-all",
        collapsed ? "w-8" : "w-auto",
        className
      )}
      {...props}
    />
  )
}
