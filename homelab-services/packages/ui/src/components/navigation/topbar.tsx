/**
 * TopBar Component
 *
 * Header bar with search, notifications, and user menu.
 *
 * @example
 * ```tsx
 * <TopBar>
 *   <TopBarSearch
 *     placeholder="Search..."
 *     onSearch={(query) => console.log(query)}
 *   />
 *
 *   <TopBarActions>
 *     <TopBarNotifications
 *       count={3}
 *       notifications={[
 *         { id: 1, title: "New message", time: "2m ago" },
 *         { id: 2, title: "System update", time: "1h ago" },
 *       ]}
 *     />
 *
 *     <TopBarUser
 *       name="John Doe"
 *       email="john@example.com"
 *       avatar="/avatar.jpg"
 *       onSignOut={() => console.log("Sign out")}
 *     />
 *   </TopBarActions>
 * </TopBar>
 * ```
 */

import * as React from "react"
import { Bell, Search, LogOut, Settings, Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "@/lib/theme-provider"

export function TopBar({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <header
      className={cn(
        "flex h-16 items-center justify-between border-b bg-background px-6",
        className
      )}
      {...props}
    >
      {children}
    </header>
  )
}

export interface TopBarSearchProps {
  placeholder?: string
  onSearch?: (query: string) => void
  className?: string
}

export function TopBarSearch({
  placeholder = "Search...",
  onSearch,
  className,
}: TopBarSearchProps) {
  const [query, setQuery] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(query)
  }

  return (
    <form onSubmit={handleSubmit} className={cn("flex-1 max-w-md", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>
    </form>
  )
}

export function TopBarActions({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      {children}
    </div>
  )
}

export interface Notification {
  id: string | number
  title: string
  description?: string
  time?: string
  unread?: boolean
}

export interface TopBarNotificationsProps {
  count?: number
  notifications?: Notification[]
  onNotificationClick?: (notification: Notification) => void
  onMarkAllRead?: () => void
  className?: string
}

export function TopBarNotifications({
  count = 0,
  notifications = [],
  onNotificationClick,
  onMarkAllRead,
  className,
}: TopBarNotificationsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("relative", className)}>
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
            >
              {count > 9 ? "9+" : count}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={onMarkAllRead}
            >
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className="flex cursor-pointer flex-col items-start gap-1 p-3"
              onClick={() => onNotificationClick?.(notification)}
            >
              <div className="flex w-full items-start justify-between gap-2">
                <span className="font-medium">{notification.title}</span>
                {notification.unread && (
                  <span className="h-2 w-2 rounded-full bg-primary" />
                )}
              </div>
              {notification.description && (
                <span className="text-xs text-muted-foreground">
                  {notification.description}
                </span>
              )}
              {notification.time && (
                <span className="text-xs text-muted-foreground">
                  {notification.time}
                </span>
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function TopBarThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "glass" : "dark")}
      className={className}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

export interface TopBarUserProps {
  name: string
  email?: string
  avatar?: string
  onSignOut?: () => void
  onSettings?: () => void
  className?: string
}

export function TopBarUser({
  name,
  email,
  avatar,
  onSignOut,
  onSettings,
  className,
}: TopBarUserProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={cn("relative h-10 w-10 rounded-full", className)}>
          <Avatar>
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{name}</p>
            {email && (
              <p className="text-xs leading-none text-muted-foreground">{email}</p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {onSettings && (
          <DropdownMenuItem onClick={onSettings}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        )}
        {onSignOut && (
          <DropdownMenuItem onClick={onSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
