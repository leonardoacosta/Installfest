/**
 * Sparkline Component
 *
 * Compact inline chart for showing trends at a glance.
 *
 * @example
 * ```tsx
 * const data = [
 *   { value: 10 },
 *   { value: 20 },
 *   { value: 15 },
 *   { value: 30 },
 *   { value: 25 },
 * ]
 *
 * <Sparkline data={data} dataKey="value" trend="up" />
 * ```
 */

import * as React from "react"
import { LineChart, Line, ResponsiveContainer } from "recharts"
import { cn } from "@/lib/utils"
import { useChartTheme } from "./chart-container"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

export interface SparklineProps {
  data: any[]
  dataKey: string
  height?: number
  width?: number | string
  color?: string
  trend?: "up" | "down" | "neutral"
  showTrend?: boolean
  strokeWidth?: number
  className?: string
}

export function Sparkline({
  data,
  dataKey,
  height = 40,
  width = "100%",
  color,
  trend,
  showTrend = false,
  strokeWidth = 2,
  className,
}: SparklineProps) {
  const themeColors = useChartTheme()

  // Determine color based on trend if not provided
  const lineColor = React.useMemo(() => {
    if (color) return color

    if (trend === "up") return themeColors.success
    if (trend === "down") return themeColors.error
    return themeColors.primary
  }, [color, trend, themeColors])

  // Calculate trend from data if not provided
  const calculatedTrend = React.useMemo(() => {
    if (trend) return trend
    if (data.length < 2) return "neutral"

    const first = data[0][dataKey]
    const last = data[data.length - 1][dataKey]

    if (last > first) return "up"
    if (last < first) return "down"
    return "neutral"
  }, [data, dataKey, trend])

  const TrendIcon = calculatedTrend === "up" ? TrendingUp : calculatedTrend === "down" ? TrendingDown : Minus

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div style={{ width, height }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={lineColor}
              strokeWidth={strokeWidth}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {showTrend && (
        <TrendIcon
          className={cn(
            "h-4 w-4 shrink-0",
            calculatedTrend === "up" && "text-green-500",
            calculatedTrend === "down" && "text-red-500",
            calculatedTrend === "neutral" && "text-gray-500"
          )}
        />
      )}
    </div>
  )
}

export interface SparkbarProps {
  data: any[]
  dataKey: string
  height?: number
  width?: number | string
  color?: string
  className?: string
}

export function Sparkbar({
  data,
  dataKey,
  height = 40,
  width = "100%",
  color,
  className,
}: SparkbarProps) {
  const themeColors = useChartTheme()
  const barColor = color || themeColors.primary

  const max = Math.max(...data.map((d) => d[dataKey]))

  return (
    <div className={cn("flex items-end gap-0.5", className)} style={{ width, height }}>
      {data.map((item, index) => {
        const barHeight = (item[dataKey] / max) * 100
        return (
          <div
            key={index}
            className="flex-1 rounded-t"
            style={{
              height: `${barHeight}%`,
              backgroundColor: barColor,
              minHeight: "2px",
            }}
          />
        )
      })}
    </div>
  )
}
