"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SalaryChart } from "@/components/salary-chart"
import { Slider } from "@/components/ui/slider"

// UK Tax rates for 2024/25
const TAX_BRACKETS = [
  { min: 0, max: 12570, rate: 0 }, // Personal allowance
  { min: 12570, max: 50270, rate: 0.2 }, // Basic rate
  { min: 50270, max: 125140, rate: 0.4 }, // Higher rate
  { min: 125140, max: Number.POSITIVE_INFINITY, rate: 0.45 }, // Additional rate
]

const NI_BRACKETS = [
  { min: 0, max: 12570, rate: 0 },
  { min: 12570, max: 50270, rate: 0.12 },
  { min: 50270, max: Number.POSITIVE_INFINITY, rate: 0.02 },
]

const PENSION_ANNUAL_ALLOWANCE = 60000
const CHILDCARE_FREE_HOURS_THRESHOLD = 100000
const FREE_CHILDCARE_HOURS_PER_WEEK_UNDER_100K = 30
const FREE_CHILDCARE_HOURS_PER_WEEK_3_4_YEARS = 15
const SCHOOL_WEEKS_PER_YEAR = 38

function calculateTax(taxableIncome: number): number {
  let tax = 0
  let remainingIncome = taxableIncome

  // Handle personal allowance taper for high earners
  let personalAllowance = 12570
  if (taxableIncome > 100000) {
    const reduction = Math.min(personalAllowance, (taxableIncome - 100000) / 2)
    personalAllowance -= reduction
  }

  for (const bracket of TAX_BRACKETS) {
    if (remainingIncome <= 0) break

    const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min)
    const adjustedMin = bracket.min === 0 ? 0 : Math.max(bracket.min, taxableIncome - remainingIncome)

    if (bracket.min === 0) {
      // Personal allowance bracket
      const allowanceUsed = Math.min(taxableInBracket, personalAllowance)
      tax += Math.max(0, taxableInBracket - allowanceUsed) * bracket.rate
    } else {
      tax += taxableInBracket * bracket.rate
    }

    remainingIncome -= taxableInBracket
  }

  return tax
}

function calculateNI(income: number): number {
  let ni = 0
  let remainingIncome = income

  for (const bracket of NI_BRACKETS) {
    if (remainingIncome <= 0) break

    const incomeInBracket = Math.min(remainingIncome, bracket.max - bracket.min)
    ni += incomeInBracket * bracket.rate
    remainingIncome -= incomeInBracket
  }

  return ni
}

export default function SalaryCalculator() {
  const [salary, setSalary] = useState(50000)
  const [bonus, setBonus] = useState(0)
  const [pensionContributionPercent, setPensionContributionPercent] = useState(5)
  const [employerPensionPercent, setEmployerPensionPercent] = useState(3)
  const [electricCarSacrifice, setElectricCarSacrifice] = useState(0)
  const [bikeToWorkSacrifice, setBikeToWorkSacrifice] = useState(0)
  const [nurseryCostPerHour, setNurseryCostPerHour] = useState(12)
  const [nurseryHoursPerWeek, setNurseryHoursPerWeek] = useState(40)
  const [children9MonthsTo3Years, setChildren9MonthsTo3Years] = useState(1)
  const [children3To4Years, setChildren3To4Years] = useState(0)

  const calculations = useMemo(() => {
    const grossIncome = salary + bonus
    const totalSalarySacrifice = electricCarSacrifice + bikeToWorkSacrifice
    const employeePensionContribution = (grossIncome * pensionContributionPercent) / 100
    const employerPensionContribution = (grossIncome * employerPensionPercent) / 100
    const totalPensionContribution = employeePensionContribution + employerPensionContribution

    const taxableIncome = grossIncome - employeePensionContribution - totalSalarySacrifice
    const tax = calculateTax(taxableIncome)
    const nationalInsurance = calculateNI(grossIncome - employeePensionContribution - totalSalarySacrifice)

    // Nursery calculations for different age groups
    const isUnder100k = taxableIncome < CHILDCARE_FREE_HOURS_THRESHOLD

    // Children 9 months to 3 years: 30 hours free if under £100k, otherwise 0
    const freeHours9MonthsTo3Years = isUnder100k ? FREE_CHILDCARE_HOURS_PER_WEEK_UNDER_100K : 0
    const paidHours9MonthsTo3Years = Math.max(0, nurseryHoursPerWeek - freeHours9MonthsTo3Years)
    const cost9MonthsTo3Years =
      paidHours9MonthsTo3Years * nurseryCostPerHour * SCHOOL_WEEKS_PER_YEAR * children9MonthsTo3Years

    // Children 3-4 years: 15 hours free always, 30 hours if under £100k
    const freeHours3To4Years = isUnder100k
      ? FREE_CHILDCARE_HOURS_PER_WEEK_UNDER_100K
      : FREE_CHILDCARE_HOURS_PER_WEEK_3_4_YEARS
    const paidHours3To4Years = Math.max(0, nurseryHoursPerWeek - freeHours3To4Years)
    const cost3To4Years = paidHours3To4Years * nurseryCostPerHour * SCHOOL_WEEKS_PER_YEAR * children3To4Years

    const nurseryAnnualCost = cost9MonthsTo3Years + cost3To4Years

    const takeHome =
      grossIncome - employeePensionContribution - tax - nationalInsurance - totalSalarySacrifice - nurseryAnnualCost

    return {
      grossIncome,
      taxableIncome,
      employeePensionContribution,
      employerPensionContribution,
      totalPensionContribution,
      tax,
      nationalInsurance,
      totalSalarySacrifice,
      electricCarSacrifice,
      bikeToWorkSacrifice,
      nurseryAnnualCost,
      freeHours9MonthsTo3Years,
      freeHours3To4Years,
      paidHours9MonthsTo3Years,
      paidHours3To4Years,
      cost9MonthsTo3Years,
      cost3To4Years,
      isUnder100k,
      takeHome,
    }
  }, [
    salary,
    bonus,
    pensionContributionPercent,
    employerPensionPercent,
    electricCarSacrifice,
    bikeToWorkSacrifice,
    nurseryCostPerHour,
    nurseryHoursPerWeek,
    children9MonthsTo3Years,
    children3To4Years,
  ])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">UK Salary Calculator</h1>
        <p className="text-muted-foreground">Calculate your take-home pay, tax, and pension contributions</p>
      </div>

      {/* Warning Banner */}
      <div className="max-w-4xl mx-auto">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-amber-600 mt-0.5">⚠️</div>
            <div>
              <p className="text-amber-800 font-medium">
                Disclaimer: This calculator is "vibe-coded" for educational purposes
              </p>
              <p className="text-amber-700 text-sm mt-1">
                Results should be taken with a pinch of salt. Tax calculations are approximate and may not reflect your
                exact situation. Always consult with a qualified financial advisor or use official HMRC tools for
                accurate tax planning.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Controls */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Salary & Bonus</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="salary">Annual Salary (£)</Label>
                <Input
                  id="salary"
                  type="number"
                  value={salary === 0 ? "" : salary}
                  onChange={(e) => {
                    const value = e.target.value
                    setSalary(value === "" ? 0 : Number(value))
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bonus">Expected Annual Bonus (£)</Label>
                <Input
                  id="bonus"
                  type="number"
                  value={bonus === 0 ? "" : bonus}
                  onChange={(e) => {
                    const value = e.target.value
                    setBonus(value === "" ? 0 : Number(value))
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pension Contribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pension">Employee Contribution: {pensionContributionPercent}%</Label>
                <Slider
                  id="pension"
                  min={0}
                  max={40}
                  step={0.5}
                  value={[pensionContributionPercent]}
                  onValueChange={(value) => setPensionContributionPercent(value[0])}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  £{calculations.employeePensionContribution.toLocaleString()} per year
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employer-pension">Employer Contribution: {employerPensionPercent}%</Label>
                <Slider
                  id="employer-pension"
                  min={0}
                  max={20}
                  step={0.5}
                  value={[employerPensionPercent]}
                  onValueChange={(value) => setEmployerPensionPercent(value[0])}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  £{calculations.employerPensionContribution.toLocaleString()} per year
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Salary Sacrifice</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="electric-car">Electric Car (£/year)</Label>
                <Input
                  id="electric-car"
                  type="number"
                  value={electricCarSacrifice === 0 ? "" : electricCarSacrifice}
                  onChange={(e) => {
                    const value = e.target.value
                    setElectricCarSacrifice(value === "" ? 0 : Number(value))
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bike-to-work">Bike to Work Scheme (£/year)</Label>
                <Input
                  id="bike-to-work"
                  type="number"
                  value={bikeToWorkSacrifice === 0 ? "" : bikeToWorkSacrifice}
                  onChange={(e) => {
                    const value = e.target.value
                    setBikeToWorkSacrifice(value === "" ? 0 : Number(value))
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Childcare</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nursery-cost">Nursery Cost per Hour (£)</Label>
                <Input
                  id="nursery-cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={nurseryCostPerHour === 0 ? "" : nurseryCostPerHour}
                  onChange={(e) => {
                    const value = e.target.value
                    setNurseryCostPerHour(value === "" ? 0 : Number(value))
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nursery-hours">Nursery Hours per Week</Label>
                <Input
                  id="nursery-hours"
                  type="number"
                  value={nurseryHoursPerWeek === 0 ? "" : nurseryHoursPerWeek}
                  onChange={(e) => {
                    const value = e.target.value
                    setNurseryHoursPerWeek(value === "" ? 0 : Number(value))
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="children-9m-3y">Children aged 9 months - 3 years</Label>
                <Input
                  id="children-9m-3y"
                  type="number"
                  min="0"
                  value={children9MonthsTo3Years === 0 ? "" : children9MonthsTo3Years}
                  onChange={(e) => {
                    const value = e.target.value
                    setChildren9MonthsTo3Years(value === "" ? 0 : Number(value))
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="children-3-4y">Children aged 3-4 years</Label>
                <Input
                  id="children-3-4y"
                  type="number"
                  min="0"
                  value={children3To4Years === 0 ? "" : children3To4Years}
                  onChange={(e) => {
                    const value = e.target.value
                    setChildren3To4Years(value === "" ? 0 : Number(value))
                  }}
                />
              </div>

              {/* Free hours breakdown */}
              <div className="text-sm space-y-1 pt-2 border-t">
                <p className="font-medium text-gray-700">Free childcare hours per week:</p>
                {children9MonthsTo3Years > 0 && (
                  <p className="text-gray-600">
                    • 9m-3y children: {calculations.freeHours9MonthsTo3Years} hours each
                    {!calculations.isUnder100k && " (income ≥ £100k)"}
                  </p>
                )}
                {children3To4Years > 0 && (
                  <p className="text-gray-600">
                    • 3-4y children: {calculations.freeHours3To4Years} hours each
                    {calculations.isUnder100k ? " (income < £100k)" : " (15h universal + 0h additional)"}
                  </p>
                )}
                {calculations.isUnder100k && (children9MonthsTo3Years > 0 || children3To4Years > 0) && (
                  <p className="text-green-600 text-xs">
                    ✓ Eligible for additional free hours (taxable income {"<"} £100k)
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Salary Breakdown</CardTitle>
              <CardDescription>Visual breakdown of your salary, tax, and deductions</CardDescription>
            </CardHeader>
            <CardContent>
              <SalaryChart data={calculations} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">£{calculations.takeHome.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Take Home</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">£{calculations.grossIncome.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Gross Income</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                £{calculations.totalPensionContribution.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Total Pension</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                £{(calculations.tax + calculations.nationalInsurance).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Tax + NI</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
