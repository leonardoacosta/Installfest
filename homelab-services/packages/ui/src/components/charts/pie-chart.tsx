/**
 * PieChart Component
 *
 * Themed pie and donut chart wrapper for proportional data.
 *
 * @example
 * ```tsx
 * const data = [
 *   { name: "Desktop", value: 400 },
 *   { name: "Mobile", value: 300 },
 *   { name: "Tablet", value: 200 },
 * ]
 *
 * <SimplePieChart
 *   data={data}
 *   dataKey="value"
 *   nameKey="name"
 *   title="Traffic by Device"
 *   height={300}
 * />
 * ```
 */

import * as React from "react"
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts"
import { ChartContainer, useChartTheme, useChartConfig } from "./chart-container"

export interface SimplePieChartProps {
  data: any[]
  dataKey: string
  nameKey: string
  title?: React.ReactNode
  description?: React.ReactNode
  height?: number
  showLegend?: boolean
  showTooltip?: boolean
  colors?: string[]
  donut?: boolean
  innerRadius?: number
  outerRadius?: number
  showLabels?: boolean
  className?: string
}

export function SimplePieChart({
  data,
  dataKey,
  nameKey,
  title,
  description,
  height = 300,
  showLegend = true,
  showTooltip = true,
  colors,
  donut = false,
  innerRadius,
  outerRadius,
  showLabels = false,
  className,
}: SimplePieChartProps) {
  const themeColors = useChartTheme()
  const config = useChartConfig()

  const pieColors = colors || [
    themeColors.primary,
    themeColors.secondary,
    themeColors.success,
    themeColors.warning,
    themeColors.error,
    "#9B59B6", // Purple
    "#3498DB", // Blue
    "#E67E22", // Orange
  ]

  const defaultInnerRadius = donut ? 60 : 0
  const defaultOuterRadius = 80

  const renderLabel = showLabels
    ? ({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`
    : false

  return (
    <ChartContainer title={title} description={description} height={height} className={className}>
      <RechartsPieChart>
        <Pie
          data={data}
          dataKey={dataKey}
          nameKey={nameKey}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius ?? defaultInnerRadius}
          outerRadius={outerRadius ?? defaultOuterRadius}
          label={renderLabel}
          paddingAngle={2}
        >
          {data.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
          ))}
        </Pie>
        {showTooltip && <Tooltip {...config.tooltip} />}
        {showLegend && <Legend {...config.legend} />}
      </RechartsPieChart>
    </ChartContainer>
  )
}

export interface DonutChartProps extends SimplePieChartProps {
  centerLabel?: React.ReactNode
  centerValue?: React.ReactNode
}

export function DonutChart({
  centerLabel,
  centerValue,
  innerRadius = 60,
  outerRadius = 80,
  ...props
}: DonutChartProps) {
  return (
    <div className="relative">
      <SimplePieChart
        {...props}
        donut
        innerRadius={innerRadius}
        outerRadius={outerRadius}
      />
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {centerValue && (
            <div className="text-2xl font-bold">{centerValue}</div>
          )}
          {centerLabel && (
            <div className="text-sm text-muted-foreground">{centerLabel}</div>
          )}
        </div>
      )}
    </div>
  )
}
