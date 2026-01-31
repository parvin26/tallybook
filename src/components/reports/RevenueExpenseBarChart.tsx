'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface RevenueExpenseBarChartProps {
  totalRevenue: number
  totalExpenses: number
}

export function RevenueExpenseBarChart({ totalRevenue, totalExpenses }: RevenueExpenseBarChartProps) {
  const data = [
    { name: 'Revenue', value: totalRevenue, fill: '#2A9D8F' },
    { name: 'Expenses', value: totalExpenses, fill: '#E76F51' },
  ]

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-gray-800">Revenue vs Expenses</h3>
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
            <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} fontSize={11} />
            <YAxis type="category" dataKey="name" width={70} fontSize={12} />
            <Tooltip formatter={(value: number) => [formatCurrency(value), '']} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
