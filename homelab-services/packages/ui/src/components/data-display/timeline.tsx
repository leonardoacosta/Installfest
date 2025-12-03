/**
 * Timeline Component
 *
 * Vertical timeline for displaying chronological events with custom icons and status indicators.
 *
 * @example
 * ```tsx
 * <Timeline>
 *   <TimelineItem
 *     icon={Package}
 *     status="success"
 *     title="Order shipped"
 *     description="Your package is on its way"
 *     timestamp="2 hours ago"
 *   />
 *   <TimelineItem
 *     icon={Truck}
 *     status="in-progress"
 *     title="In transit"
 *     description="Package arrived at distribution center"
 *     timestamp="1 hour ago"
 *     active
 *   />
 *   <TimelineItem
 *     icon={Home}
 *     status="pending"
 *     title="Out for delivery"
 *     description="Scheduled for delivery today"
 *     timestamp="Pending"
 *   />
 * </Timeline>
 * ```
 */

import * as React from "react"
import { type LucideIcon, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

export function Timeline({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("relative space-y-4", className)} {...props}>
      {children}
    </div>
  )
}

export interface TimelineItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  icon?: LucideIcon
  status?: "success" | "error" | "warning" | "in-progress" | "pending"
  title: React.ReactNode
  description?: React.ReactNode
  timestamp?: React.ReactNode
  active?: boolean
  last?: boolean
}

export function TimelineItem({
  icon: Icon = Circle,
  status = "pending",
  title,
  description,
  timestamp,
  active = false,
  last = false,
  className,
  children,
  ...props
}: TimelineItemProps) {
  const statusColors = {
    success: "bg-green-500 border-green-500 text-white",
    error: "bg-red-500 border-red-500 text-white",
    warning: "bg-yellow-500 border-yellow-500 text-white",
    "in-progress": "bg-cyan-500 border-cyan-500 text-white animate-pulse",
    pending: "bg-gray-300 dark:bg-gray-700 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400",
  }

  const lineColors = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
    "in-progress": "bg-cyan-500",
    pending: "bg-gray-300 dark:bg-gray-700",
  }

  return (
    <div className={cn("relative flex gap-4", className)} {...props}>
      {/* Icon column */}
      <div className="relative flex flex-col items-center">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
            statusColors[status],
            active && "ring-4 ring-primary/20"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        {!last && (
          <div
            className={cn(
              "absolute top-10 h-full w-0.5",
              lineColors[status]
            )}
          />
        )}
      </div>

      {/* Content column */}
      <div className="flex-1 pb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <h4
              className={cn(
                "text-sm font-medium leading-none",
                active && "text-primary"
              )}
            >
              {title}
            </h4>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
            {children}
          </div>
          {timestamp && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {timestamp}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export interface TimelineGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  date?: React.ReactNode
}

export function TimelineGroup({
  date,
  className,
  children,
  ...props
}: TimelineGroupProps) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      {date && (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <h3 className="text-sm font-semibold text-foreground">{date}</h3>
        </div>
      )}
      {children}
    </div>
  )
}
