/**
 * LineChart Component
 *
 * Themed line chart wrapper for time series data.
 *
 * @example
 * ```tsx
 * const data = [
 *   { date: "Jan", value: 400 },
 *   { date: "Feb", value: 300 },
 *   { date: "Mar", value: 600 },
 * ]
 *
 * <SimpleLineChart
 *   data={data}
 *   dataKey="value"
 *   xAxisKey="date"
 *   title="Monthly Sales"
 *   height={300}
 * />
 * ```
 */

import * as React from "react"
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import { ChartContainer, useChartTheme, useChartConfig } from "./chart-container"

export interface SimpleLineChartProps {
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
  strokeWidth?: number
  dot?: boolean
  className?: string
}

export function SimpleLineChart({
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
  strokeWidth = 2,
  dot = false,
  className,
}: SimpleLineChartProps) {
  const themeColors = useChartTheme()
  const config = useChartConfig()

  const dataKeys = Array.isArray(dataKey) ? dataKey : [dataKey]
  const lineColors = colors || [
    themeColors.primary,
    themeColors.secondary,
    themeColors.success,
    themeColors.warning,
    themeColors.error,
  ]

  return (
    <ChartContainer title={title} description={description} height={height} className={className}>
      <RechartsLineChart data={data}>
        {showGrid && <CartesianGrid {...config.cartesianGrid} />}
        <XAxis dataKey={xAxisKey} {...config.xAxis} />
        <YAxis {...config.yAxis} />
        {showTooltip && <Tooltip {...config.tooltip} />}
        {showLegend && <Legend {...config.legend} />}
        {dataKeys.map((key, index) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={lineColors[index % lineColors.length]}
            strokeWidth={strokeWidth}
            dot={dot}
            activeDot={{ r: 6 }}
          />
        ))}
      </RechartsLineChart>
    </ChartContainer>
  )
}

export interface AreaLineChartProps extends SimpleLineChartProps {
  fillOpacity?: number
}

export function AreaLineChart({
  fillOpacity = 0.1,
  ...props
}: AreaLineChartProps) {
  const themeColors = useChartTheme()
  const config = useChartConfig()

  const dataKeys = Array.isArray(props.dataKey) ? props.dataKey : [props.dataKey]
  const lineColors = props.colors || [
    themeColors.primary,
    themeColors.secondary,
    themeColors.success,
  ]

  return (
    <ChartContainer title={props.title} description={props.description} height={props.height} className={props.className}>
      <RechartsLineChart data={props.data}>
        {props.showGrid !== false && <CartesianGrid {...config.cartesianGrid} />}
        <XAxis dataKey={props.xAxisKey} {...config.xAxis} />
        <YAxis {...config.yAxis} />
        {props.showTooltip !== false && <Tooltip {...config.tooltip} />}
        {props.showLegend && <Legend {...config.legend} />}
        <defs>
          {dataKeys.map((key, index) => (
            <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={lineColors[index]} stopOpacity={fillOpacity * 2} />
              <stop offset="95%" stopColor={lineColors[index]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        {dataKeys.map((key, index) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={lineColors[index % lineColors.length]}
            strokeWidth={props.strokeWidth || 2}
            fill={`url(#gradient-${key})`}
            dot={props.dot || false}
            activeDot={{ r: 6 }}
          />
        ))}
      </RechartsLineChart>
    </ChartContainer>
  )
}
