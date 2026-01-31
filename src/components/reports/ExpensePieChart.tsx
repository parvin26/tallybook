'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '@/lib/utils'

/** Nature palette: Muted Teal, Sand, Clay, Burnt Orange, Charcoal */
const CHART_COLORS = ['#2A9D8F', '#E9C46A', '#F4A261', '#E76F51', '#264653']

interface ExpensePieChartProps {
  expensesByCategory: Record<string, number>
  /** When 'row', chart is left and legend list is right (side-by-side) */
  layout?: 'stack' | 'row'
  /** Limit to top N categories + "Other". Omit for all. */
  maxCategories?: number
  /** Compact mode: reduced chart height, two-column legend */
  compact?: boolean
  /** When true, do not render outer card (border/background); for embedding in another card */
  embedded?: boolean
}

export function ExpensePieChart({
  expensesByCategory,
  layout = 'stack',
  maxCategories,
  compact = false,
  embedded = false,
}: ExpensePieChartProps) {
  const { t } = useTranslation()

  const { data, total } = useMemo(() => {
    const entries = Object.entries(expensesByCategory)
      .filter(([, v]) => v > 0)
      .sort(([, a], [, b]) => b - a)
    const total = entries.reduce((sum, [, v]) => sum + v, 0)
    let mapped: { name: string; value: number; color: string }[]
    if (maxCategories != null && maxCategories > 0 && entries.length > maxCategories) {
      const top = entries.slice(0, maxCategories)
      const otherSum = entries.slice(maxCategories).reduce((s, [, v]) => s + v, 0)
      mapped = [
        ...top.map(([name, value], i) => ({
          name,
          value,
          color: CHART_COLORS[i % CHART_COLORS.length],
        })),
        { name: 'Other', value: otherSum, color: CHART_COLORS[maxCategories % CHART_COLORS.length] },
      ]
    } else {
      mapped = entries.map(([name, value], i) => ({
        name,
        value,
        color: CHART_COLORS[i % CHART_COLORS.length],
      }))
    }
    return { data: mapped, total }
  }, [expensesByCategory, maxCategories])

  if (data.length === 0) {
    return (
      <div className={embedded ? 'py-4 text-center' : 'rounded-xl border border-gray-200 bg-white p-6 text-center'}>
        <p className="text-tally-caption text-gray-500">No expense data for this period.</p>
      </div>
    )
  }

  const chartHeight = compact ? 'h-[120px] sm:h-[160px]' : layout === 'row' ? 'h-[180px] sm:h-[200px]' : 'h-[200px]'
  const chartSize = compact ? 'w-[100px] h-[100px] sm:w-[140px] sm:h-[140px]' : 'w-[180px] h-[180px] sm:w-[200px] sm:h-[200px]'
  const chartBlock = (
    <div
      className={
        layout === 'row'
          ? `flex-shrink-0 ${chartSize}`
          : `${chartHeight} w-full`
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={compact ? 28 : layout === 'row' ? 50 : 60}
            outerRadius={compact ? 42 : layout === 'row' ? 70 : 80}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), '']}
            contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )

  const legendMinHeight =
    layout === 'row'
      ? compact
        ? 'min-h-[120px] sm:min-h-[160px]'
        : 'min-h-[180px] sm:min-h-[200px]'
      : undefined

  const legendBlock = (
    <div
      className={
        layout === 'row'
          ? `w-full sm:w-auto flex-1 min-w-0 overflow-hidden flex flex-col justify-center ${legendMinHeight ?? ''} space-y-2`
          : compact
            ? 'mt-2 space-y-1.5 border-t border-gray-100 pt-2'
            : 'mt-3 space-y-1.5 border-t border-gray-100 pt-3'
      }
    >
      {data.map((entry) => {
        const percent = total > 0 ? (entry.value / total) * 100 : 0
        const percentStr = percent >= 0.1 ? percent.toFixed(0) : percent.toFixed(1)
        const label = t(`expenseCategories.${entry.name}`) || entry.name
        return (
          <div key={entry.name} className="flex justify-between items-center w-full text-sm">
            <div className="flex items-center gap-2 truncate min-w-0">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="truncate text-gray-700">{label}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-medium tabular-nums">{formatCurrency(entry.value)}</span>
              <span className="text-gray-500 text-xs">({percentStr}%)</span>
            </div>
          </div>
        )
      })}
    </div>
  )

  const wrapperClass = embedded
    ? compact ? 'p-0' : 'p-0'
    : `rounded-xl border border-gray-200 bg-white shadow-sm ${compact ? 'p-3' : 'p-4'}`

  return (
    <div className={wrapperClass}>
      {layout === 'row' ? (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {chartBlock}
          {legendBlock}
        </div>
      ) : (
        <>
          <div>{chartBlock}</div>
          {legendBlock}
        </>
      )}
    </div>
  )
}
