'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCurrency } from '@/lib/utils'

const CHART_COLORS = ['#2A9D8F', '#E9C46A', '#F4A261', '#E76F51', '#264653']
const MAX_LEGEND_ITEMS = 4

export interface SalesByItemEntry {
  itemId: string
  itemName: string
  quantity: number
  amount: number
}

interface SalesByItemPieChartProps {
  salesByItem: SalesByItemEntry[]
}

/** Donut + legend. No labels on the donut; list shows name, amount, and %. Tooltip on tap/hover. */
export function SalesByItemPieChart({ salesByItem }: SalesByItemPieChartProps) {
  const { data, totalSalesAmount } = useMemo(() => {
    const withAmount = salesByItem.filter((r) => r.amount > 0)
    const total = withAmount.reduce((sum, r) => sum + r.amount, 0)
    if (total === 0) return { data: [] as { name: string; value: number; color: string }[], totalSalesAmount: 0 }
    const sorted = [...withAmount].sort((a, b) => b.amount - a.amount)
    const top = sorted.slice(0, MAX_LEGEND_ITEMS)
    const rest = sorted.slice(MAX_LEGEND_ITEMS)
    const otherSum = rest.reduce((s, r) => s + r.amount, 0)
    const mapped = top.map((r, i) => ({
      name: r.itemName,
      value: r.amount,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }))
    if (otherSum > 0) {
      mapped.push({
        name: 'Others',
        value: otherSum,
        color: CHART_COLORS[MAX_LEGEND_ITEMS % CHART_COLORS.length],
      })
    }
    return { data: mapped, totalSalesAmount: total }
  }, [salesByItem])

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-6 text-center min-h-[180px]">
        <p className="text-tally-body text-gray-500">No sales yet for this period.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 overflow-visible">
      <div className="flex-shrink-0 w-[150px] h-[150px] sm:w-[170px] sm:h-[170px] overflow-visible p-1 sm:-ml-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 4, right: 8, bottom: 4, left: 4 }}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={38}
              outerRadius={54}
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
      <div className="w-full sm:w-auto flex-1 min-w-0 min-h-[150px] sm:min-h-[170px] space-y-2 overflow-visible flex flex-col justify-center">
        {data.map((entry) => {
          const percent =
            totalSalesAmount > 0
              ? (entry.value / totalSalesAmount) * 100
              : 0
          const percentStr = percent >= 0.1 ? percent.toFixed(0) : percent.toFixed(1)
          return (
            <div
              key={entry.name}
              className="flex justify-between items-center w-full text-sm"
            >
              <div className="flex items-center gap-2 truncate min-w-0">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="truncate text-gray-700">{entry.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-medium tabular-nums">{formatCurrency(entry.value)}</span>
                <span className="text-gray-500 text-xs">({percentStr}%)</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
