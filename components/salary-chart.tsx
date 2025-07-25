"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Cell } from "recharts"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"

interface SalaryData {
  grossIncome: number
  taxableIncome: number
  employeePensionContribution: number
  employerPensionContribution: number
  totalPensionContribution: number
  tax: number
  nationalInsurance: number
  totalSalarySacrifice: number
  electricCarSacrifice: number
  bikeToWorkSacrifice: number
  nurseryAnnualCost: number
  takeHome: number
}

interface SalaryChartProps {
  data: SalaryData
}

const TAX_THRESHOLDS = [37700, 60000, 100000, 125140]
const PENSION_ALLOWANCE = 60000

export function SalaryChart({ data }: SalaryChartProps) {
  const chartData = [
    {
      name: "Earnings",
      value: data.grossIncome,
      type: "earnings",
      color: "#64748b",
    },
    {
      name: "Taxable Income",
      value: data.taxableIncome,
      type: "taxable",
      color: data.taxableIncome >= 100000 ? "#ef4444" : "#22c55e",
    },
    {
      name: "Take-Home",
      value: data.takeHome,
      type: "takehome",
      color: "#10b981",
    },
    {
      name: "Total Pension",
      employeePension: data.employeePensionContribution,
      employerPension: data.employerPensionContribution,
      value: data.totalPensionContribution,
      type: "pension",
      color: data.totalPensionContribution > PENSION_ALLOWANCE ? "#ef4444" : "#3b82f6",
      employeeColor: data.totalPensionContribution > PENSION_ALLOWANCE ? "#ef4444" : "#3b82f6",
      employerColor: data.totalPensionContribution > PENSION_ALLOWANCE ? "#fca5a5" : "#93c5fd",
    },
    {
      name: "Tax",
      value: data.tax,
      type: "tax",
      color: "#f59e0b",
    },
    {
      name: "National Insurance",
      value: data.nationalInsurance,
      type: "ni",
      color: "#f97316",
    },
    {
      name: "Electric Car",
      value: data.electricCarSacrifice,
      type: "sacrifice",
      color: "#8b5cf6",
    },
    {
      name: "Bike to Work",
      value: data.bikeToWorkSacrifice,
      type: "sacrifice",
      color: "#a855f7",
    },
    {
      name: "Nursery Costs",
      value: data.nurseryAnnualCost,
      type: "nursery",
      color: "#ec4899",
    },
  ].filter((item) => item.value > 0 || ["Earnings", "Taxable Income", "Take-Home"].includes(item.name))

  const maxValue = Math.max(data.grossIncome, ...TAX_THRESHOLDS, PENSION_ALLOWANCE)

  return (
    <div className="space-y-4">
      <ChartContainer
        config={{
          employeePension: {
            label: "Employee Pension",
            color: "#3b82f6",
          },
          employerPension: {
            label: "Employer Pension",
            color: "#93c5fd",
          },
          value: {
            label: "Amount (£)",
            color: "hsl(var(--chart-1))",
          },
        }}
        className="min-h-[500px]"
      >
        <ResponsiveContainer width="100%" height={500}>
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 80,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="category" dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
            <YAxis
              type="number"
              domain={[0, maxValue * 1.1]}
              tickFormatter={(value) => `£${(value / 1000).toFixed(0)}k`}
            />
            <ChartTooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  if (label === "Total Pension") {
                    return (
                      <div className="bg-white p-3 border rounded-lg shadow-lg">
                        <p className="font-medium">{label}</p>
                        <div className="space-y-1">
                          <p className="text-blue-600">
                            Employee: £{data.employeePensionContribution.toLocaleString()}
                          </p>
                          <p className="text-blue-400">
                            Employer: £{data.employerPensionContribution.toLocaleString()}
                          </p>
                          <p className="font-medium border-t pt-1">
                            Total: £{data.totalPensionContribution.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )
                  } else {
                    return (
                      <div className="bg-white p-3 border rounded-lg shadow-lg">
                        <p className="font-medium">{label}</p>
                        <p>£{Number(payload[0].value).toLocaleString()}</p>
                      </div>
                    )
                  }
                }
                return null
              }}
            />

            {/* Reference lines for tax thresholds */}
            {TAX_THRESHOLDS.map((threshold) => (
              <ReferenceLine
                key={threshold}
                y={threshold}
                stroke="#666"
                strokeDasharray="2 2"
                label={{ value: `£${(threshold / 1000).toFixed(0)}k`, position: "right" }}
              />
            ))}

            {/* Pension allowance line */}
            <ReferenceLine
              y={PENSION_ALLOWANCE}
              stroke="#ef4444"
              strokeDasharray="4 4"
              label={{ value: "Pension Limit", position: "right", fill: "#ef4444" }}
            />

            {/* Employee pension contributions (bottom part of pension stack) */}
            <Bar dataKey="employeePension" stackId="pension" radius={[0, 0, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`employee-${index}`} fill={entry.employeeColor || "transparent"} />
              ))}
            </Bar>

            {/* Employer pension contributions (top part of pension stack) */}
            <Bar dataKey="employerPension" stackId="pension" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`employer-${index}`} fill={entry.employerColor || "transparent"} />
              ))}
            </Bar>

            {/* Regular bars for non-pension items */}
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.type === "pension" ? "transparent" : entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Legend and warnings */}
      <div className="space-y-2 text-sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Taxable income {"<"} £100k</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Taxable income ≥ £100k</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-emerald-500 rounded"></div>
            <span>Take-home pay</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>Employee pension</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-300 rounded"></div>
            <span>Employer pension</span>
          </div>
        </div>

        {data.totalPensionContribution > PENSION_ALLOWANCE && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">
              ⚠️ Pension contribution exceeds annual allowance of £{PENSION_ALLOWANCE.toLocaleString()}
            </p>
            <p className="text-red-600 text-xs mt-1">
              Excess: £{(data.totalPensionContribution - PENSION_ALLOWANCE).toLocaleString()}
            </p>
          </div>
        )}

        {data.taxableIncome >= 100000 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800 font-medium">
              ℹ️ High earner: Personal allowance reduced and no free childcare hours
            </p>
          </div>
        )}

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm">
            <strong>Chart Guide:</strong> The pension bar shows employee contributions (darker blue) and employer
            contributions (lighter blue) stacked together. Hover over the pension bar to see the breakdown.
          </p>
        </div>
      </div>
    </div>
  )
}
