/**
 * ChartContainer Component
 *
 * Responsive wrapper for Recharts components with theme integration.
 *
 * @example
 * ```tsx
 * <ChartContainer title="Sales Overview" description="Monthly revenue">
 *   <LineChart data={data}>
 *     <Line dataKey="revenue" stroke="#00D9D9" />
 *   </LineChart>
 * </ChartContainer>
 * ```
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { ResponsiveContainer } from "recharts"
import { useTheme } from "@/lib/theme-provider"

export interface ChartContainerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode
  description?: React.ReactNode
  height?: number | string
  aspect?: number
}

export function ChartContainer({
  title,
  description,
  height = 300,
  aspect,
  className,
  children,
  ...props
}: ChartContainerProps) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {(title || description) && (
        <div className="space-y-1">
          {title && <h3 className="text-sm font-medium leading-none">{title}</h3>}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div style={{ width: "100%", height: typeof height === "number" ? `${height}px` : height }}>
        <ResponsiveContainer width="100%" height="100%" aspect={aspect}>
          {children as any}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/**
 * Hook to get theme-aware chart colors
 */
export function useChartTheme() {
  const { theme } = useTheme()

  const colors = React.useMemo(() => {
    if (theme === "dark") {
      return {
        primary: "#00D9D9",    // Cyan
        secondary: "#00FFE6",  // Bright cyan
        success: "#00FF94",
        warning: "#FFD60A",
        error: "#FF453A",
        text: "#FFFFFF",
        textSecondary: "#A0A0A0",
        grid: "#2A2A2A",
        background: "#0A0A0A",
        surface: "#1A1A1A",
      }
    } else {
      // Glass theme
      return {
        primary: "#8B7D6B",    // Muted brown
        secondary: "#A3D977",  // Soft green
        success: "#6ABF69",
        warning: "#F4B740",
        error: "#E85D75",
        text: "#3A3A3A",
        textSecondary: "#666666",
        grid: "#D4CCC4",
        background: "#E5DDD5",
        surface: "#D4CCC4",
      }
    }
  }, [theme])

  return colors
}

/**
 * Default chart config with theme colors
 */
export function useChartConfig() {
  const colors = useChartTheme()

  return React.useMemo(
    () => ({
      cartesianGrid: {
        stroke: colors.grid,
        strokeDasharray: "3 3",
        strokeOpacity: 0.3,
      },
      xAxis: {
        stroke: colors.textSecondary,
        fontSize: 12,
        tickLine: false,
        axisLine: false,
      },
      yAxis: {
        stroke: colors.textSecondary,
        fontSize: 12,
        tickLine: false,
        axisLine: false,
      },
      tooltip: {
        contentStyle: {
          backgroundColor: colors.surface,
          border: `1px solid ${colors.grid}`,
          borderRadius: 8,
          color: colors.text,
        },
        labelStyle: {
          color: colors.textSecondary,
        },
      },
      legend: {
        iconType: "circle" as const,
        wrapperStyle: {
          paddingTop: 20,
          fontSize: 12,
          color: colors.text,
        },
      },
    }),
    [colors]
  )
}
