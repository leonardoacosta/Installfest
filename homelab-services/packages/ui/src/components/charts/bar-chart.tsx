/**
 * BarChart Component
 *
 * Themed bar chart wrapper for categorical data comparisons.
 *
 * @example
 * ```tsx
 * const data = [
 *   { category: "Q1", sales: 4000, costs: 2400 },
 *   { category: "Q2", sales: 3000, costs: 1398 },
 *   { category: "Q3", sales: 2000, costs: 9800 },
 * ]
 *
 * <SimpleBarChart
 *   data={data}
 *   dataKey={["sales", "costs"]}
 *   xAxisKey="category"
 *   title="Quarterly Performance"
 *   height={300}
 * />
 * ```
 */

import * as React from "react"
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import { ChartContainer, useChartTheme, useChartConfig } from "./chart-container"

export interface SimpleBarChartProps {
  data: any[]
  dataKey: string | string[]
  xAxisKey: string
  title?: React.ReactNode
  description?: React.ReactNode
  height?: number
  showGrid?: boolean
  showLegend?: boolean
  showTooltip?: boolean
  colors?: string[]
  horizontal?: boolean
  stacked?: boolean
  barSize?: number
  className?: string
}

export function SimpleBarChart({
  data,
  dataKey,
  xAxisKey,
  title,
  description,
  height = 300,
  showGrid = true,
  showLegend = false,
  showTooltip = true,
  colors,
  horizontal = false,
  stacked = false,
  barSize,
  className,
}: SimpleBarChartProps) {
  const themeColors = useChartTheme()
  const config = useChartConfig()

  const dataKeys = Array.isArray(dataKey) ? dataKey : [dataKey]
  const barColors = colors || [
    themeColors.primary,
    themeColors.secondary,
    themeColors.success,
    themeColors.warning,
    themeColors.error,
  ]

  return (
    <ChartContainer title={title} description={description} height={height} className={className}>
      <RechartsBarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
      >
        {showGrid && <CartesianGrid {...config.cartesianGrid} />}
        {horizontal ? (
          <>
            <XAxis type="number" {...config.xAxis} />
            <YAxis dataKey={xAxisKey} type="category" {...config.yAxis} />
          </>
        ) : (
          <>
            <XAxis dataKey={xAxisKey} {...config.xAxis} />
            <YAxis {...config.yAxis} />
          </>
        )}
        {showTooltip && <Tooltip {...config.tooltip} />}
        {showLegend && <Legend {...config.legend} />}
        {dataKeys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            fill={barColors[index % barColors.length]}
            radius={[4, 4, 0, 0]}
            barSize={barSize}
            stackId={stacked ? "stack" : undefined}
          />
        ))}
      </RechartsBarChart>
    </ChartContainer>
  )
}
