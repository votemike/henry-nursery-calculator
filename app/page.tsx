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
const FREE_CHILDCARE_HOURS_PER_WEEK = 30
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
  const [electricCarSacrifice, setElectricCarSacrifice] = useState(0)
  const [bikeToWorkSacrifice, setBikeToWorkSacrifice] = useState(0)
  const [nurseryCostPerHour, setNurseryCostPerHour] = useState(12)
  const [nurseryHoursPerWeek, setNurseryHoursPerWeek] = useState(40)
  const [numberOfChildren, setNumberOfChildren] = useState(1)

  const calculations = useMemo(() => {
    const grossIncome = salary + bonus
    const totalSalarySacrifice = electricCarSacrifice + bikeToWorkSacrifice
    const employeePensionContribution = (grossIncome * pensionContributionPercent) / 100
    const employerPensionContribution = (grossIncome * 3) / 100 // Assuming 3% employer contribution
    const totalPensionContribution = employeePensionContribution + employerPensionContribution

    const taxableIncome = grossIncome - employeePensionContribution - totalSalarySacrifice
    const tax = calculateTax(taxableIncome)
    const nationalInsurance = calculateNI(grossIncome - employeePensionContribution - totalSalarySacrifice)

    // Nursery calculations
    const freeHoursPerChild = taxableIncome < CHILDCARE_FREE_HOURS_THRESHOLD ? FREE_CHILDCARE_HOURS_PER_WEEK : 0
    const paidHoursPerChild = Math.max(0, nurseryHoursPerWeek - freeHoursPerChild)
    const nurseryAnnualCost = paidHoursPerChild * nurseryCostPerHour * SCHOOL_WEEKS_PER_YEAR * numberOfChildren

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
      freeHoursPerChild,
      paidHoursPerChild,
      takeHome,
    }
  }, [
    salary,
    bonus,
    pensionContributionPercent,
    electricCarSacrifice,
    bikeToWorkSacrifice,
    nurseryCostPerHour,
    nurseryHoursPerWeek,
    numberOfChildren,
  ])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">UK Salary Calculator</h1>
        <p className="text-muted-foreground">Calculate your take-home pay, tax, and pension contributions</p>
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
                <Label htmlFor="children">Number of Children</Label>
                <Input
                  id="children"
                  type="number"
                  min="0"
                  value={numberOfChildren === 0 ? "" : numberOfChildren}
                  onChange={(e) => {
                    const value = e.target.value
                    setNumberOfChildren(value === "" ? 0 : Number(value))
                  }}
                />
              </div>
              {calculations.freeHoursPerChild > 0 && (
                <p className="text-sm text-green-600">
                  ✓ {calculations.freeHoursPerChild} free hours per week per child (taxable income {"<"} £100k)
                </p>
              )}
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
