/**
 * State Components
 *
 * EmptyState, LoadingState, and ErrorState components for handling common UI states.
 *
 * @example
 * ```tsx
 * // Empty state
 * <EmptyState
 *   icon={Inbox}
 *   title="No messages"
 *   description="You don't have any messages yet"
 *   action={<Button>Compose Message</Button>}
 * />
 *
 * // Loading state
 * <LoadingState message="Loading data..." />
 *
 * // Error state
 * <ErrorState
 *   title="Failed to load data"
 *   description="We couldn't fetch your data. Please try again."
 *   action={<Button onClick={retry}>Retry</Button>}
 * />
 * ```
 */

import * as React from "react"
import { AlertCircle, Loader2, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  icon?: LucideIcon
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-12 text-center",
        className
      )}
      {...props}
    >
      {Icon && (
        <div className="rounded-full bg-muted p-6">
          <Icon className="h-10 w-10 text-muted-foreground" />
        </div>
      )}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-md">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: React.ReactNode
  skeleton?: boolean
  skeletonCount?: number
}

export function LoadingState({
  message = "Loading...",
  skeleton = false,
  skeletonCount = 3,
  className,
  ...props
}: LoadingStateProps) {
  if (skeleton) {
    return (
      <div className={cn("space-y-3", className)} {...props}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-12",
        className
      )}
      {...props}
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  )
}

export interface ErrorStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  icon?: LucideIcon
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  error?: Error | string
}

export function ErrorState({
  icon: Icon = AlertCircle,
  title,
  description,
  action,
  error,
  className,
  ...props
}: ErrorStateProps) {
  const errorMessage = error instanceof Error ? error.message : error

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-12 text-center",
        className
      )}
      {...props}
    >
      <div className="rounded-full bg-destructive/10 p-6">
        <Icon className="h-10 w-10 text-destructive" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-md">{description}</p>
        )}
        {errorMessage && (
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
              Error details
            </summary>
            <pre className="mt-2 rounded-md bg-muted p-2 text-left text-xs overflow-auto max-w-md">
              {errorMessage}
            </pre>
          </details>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export interface SkeletonListProps extends React.HTMLAttributes<HTMLDivElement> {
  count?: number
  itemHeight?: number
}

export function SkeletonList({
  count = 5,
  itemHeight = 80,
  className,
  ...props
}: SkeletonListProps) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="w-full" style={{ height: itemHeight }} />
      ))}
    </div>
  )
}

export interface SkeletonTableProps extends React.HTMLAttributes<HTMLDivElement> {
  rows?: number
  columns?: number
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
  ...props
}: SkeletonTableProps) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-10 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-16 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}
