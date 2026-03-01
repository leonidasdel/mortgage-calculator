import { Injectable } from '@angular/core';
import {
  AgeGroup,
  BonusBreakdown,
  MonthlyBreakdown,
  SalaryParams,
  SalaryResult,
  TaxBracketResult,
} from '../models/salary.models';

const EFKA_EMPLOYEE_RATE = 0.1337;
const EFKA_EMPLOYER_RATE = 0.2179;
const MAX_INSURABLE_EARNINGS = 7573;
const MONTHS_PER_YEAR = 14; // 12 regular + Christmas + Easter/Leave
const LEAVE_SURCHARGE_RATE = 0.04166; // Προσαύξηση επιδόματος αδείας

/**
 * Tax brackets indexed by [ageGroup][children][bracketIndex].
 * Each bracket: [from, to (null=unlimited), rate].
 */
type TaxTable = Record<AgeGroup, number[][]>;

// Rates per bracket [from, to, ...ratesByChildren(0..6+)]
// Brackets are ordered bottom-up: 0-10k, 10k-20k, 20k-30k, 30k-40k, 40k-60k, 60k+
const TAX_RATES: TaxTable = {
  under25: [
    // children:  0     1     2     3     4     5     6+
    /* 0-10k  */ [0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
    /* 10-20k */ [0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
    /* 20-30k */ [0.26, 0.24, 0.22, 0.20, 0.18, 0.16, 0.14],
    /* 30-40k */ [0.34, 0.34, 0.34, 0.34, 0.34, 0.34, 0.34],
    /* 40-60k */ [0.39, 0.39, 0.39, 0.39, 0.39, 0.39, 0.39],
    /* 60k+   */ [0.44, 0.44, 0.44, 0.44, 0.44, 0.44, 0.44],
  ],
  '26to30': [
    [0.09, 0.09, 0.09, 0.09, 0.00, 0.00, 0.00],
    [0.09, 0.09, 0.09, 0.09, 0.00, 0.00, 0.00],
    [0.26, 0.24, 0.22, 0.20, 0.18, 0.16, 0.14],
    [0.34, 0.34, 0.34, 0.34, 0.34, 0.34, 0.34],
    [0.39, 0.39, 0.39, 0.39, 0.39, 0.39, 0.39],
    [0.44, 0.44, 0.44, 0.44, 0.44, 0.44, 0.44],
  ],
  over30: [
    [0.09, 0.09, 0.09, 0.09, 0.00, 0.00, 0.00],
    [0.20, 0.18, 0.16, 0.09, 0.00, 0.00, 0.00],
    [0.26, 0.24, 0.22, 0.20, 0.18, 0.16, 0.14],
    [0.34, 0.34, 0.34, 0.34, 0.34, 0.34, 0.34],
    [0.39, 0.39, 0.39, 0.39, 0.39, 0.39, 0.39],
    [0.44, 0.44, 0.44, 0.44, 0.44, 0.44, 0.44],
  ],
};

const BRACKET_LIMITS = [10000, 20000, 30000, 40000, 60000];

const BASE_TAX_DISCOUNTS: Record<number, number> = {
  0: 777,
  1: 900,
  2: 1120,
  3: 1340,
  4: 1580,
  5: 1780,
};

@Injectable({ providedIn: 'root' })
export class SalaryCalculatorService {

  calculate(params: SalaryParams): SalaryResult {
    const gross = Math.max(0, params.grossMonthly);
    const benefitsTotal = params.benefitsInKind.reduce((s, b) => s + b.monthlyValue, 0);
    const totalGrossForInsurance = Math.min(gross, MAX_INSURABLE_EARNINGS);

    // Employee EFKA (monthly, for current salary)
    const efkaEmployee = +(totalGrossForInsurance * EFKA_EMPLOYEE_RATE).toFixed(2);
    const efkaEmployer = +(totalGrossForInsurance * EFKA_EMPLOYER_RATE).toFixed(2);

    // Determine bonus gross amounts and annual totals
    // Pro-rata when salary changed mid-year, otherwise standard
    let christmasGrossBase: number;
    let easterGrossBase: number;
    let leaveGrossBase: number;
    let annualGross14: number;
    let annualEfka14: number;
    let regularMonthlySum: number;
    let monthlyEfkaEmployeeSum: number;
    let monthlyEfkaEmployerSum: number;

    if (params.salaryChange) {
      const sc = params.salaryChange;
      const oldGross = Math.max(0, sc.previousGross);
      const cumDays = this.getCumulativeDays(params.year);

      // Pro-rata weighted salary for each bonus period
      const easterWeighted = this.getProRataGross(1, 4, sc.effectiveMonth, oldGross, gross, cumDays);
      const christmasWeighted = this.getProRataGross(5, 12, sc.effectiveMonth, oldGross, gross, cumDays);

      christmasGrossBase = +christmasWeighted.toFixed(2);
      easterGrossBase = +(easterWeighted / 2).toFixed(2);
      leaveGrossBase = +(easterWeighted / 2).toFixed(2);

      // Regular months (each fully old or fully new)
      const monthsOld = sc.effectiveMonth - 1;
      const monthsNew = 12 - monthsOld;
      regularMonthlySum = +(monthsOld * oldGross + monthsNew * gross).toFixed(2);

      // Monthly EFKA sums
      const oldEfkaEmployee = +(Math.min(oldGross, MAX_INSURABLE_EARNINGS) * EFKA_EMPLOYEE_RATE).toFixed(2);
      const oldEfkaEmployer = +(Math.min(oldGross, MAX_INSURABLE_EARNINGS) * EFKA_EMPLOYER_RATE).toFixed(2);
      monthlyEfkaEmployeeSum = +(monthsOld * oldEfkaEmployee + monthsNew * efkaEmployee).toFixed(2);
      monthlyEfkaEmployerSum = +(monthsOld * oldEfkaEmployer + monthsNew * efkaEmployer).toFixed(2);

      // 14-month annual for tax: regular months + bonus bases (without surcharges)
      annualGross14 = +(regularMonthlySum + christmasGrossBase + easterGrossBase + leaveGrossBase + benefitsTotal * 12).toFixed(2);

      // EFKA for 14-month: sum of monthly EFKAs + EFKA on bonus base amounts
      const christmasEfka14 = +(Math.min(christmasGrossBase, MAX_INSURABLE_EARNINGS) * EFKA_EMPLOYEE_RATE).toFixed(2);
      const easterEfka14 = +(Math.min(easterGrossBase, MAX_INSURABLE_EARNINGS) * EFKA_EMPLOYEE_RATE).toFixed(2);
      const leaveEfka14 = +(Math.min(leaveGrossBase, MAX_INSURABLE_EARNINGS) * EFKA_EMPLOYEE_RATE).toFixed(2);
      annualEfka14 = +(monthlyEfkaEmployeeSum + christmasEfka14 + easterEfka14 + leaveEfka14).toFixed(2);
    } else {
      christmasGrossBase = gross;
      easterGrossBase = +(gross / 2).toFixed(2);
      leaveGrossBase = +(gross / 2).toFixed(2);
      regularMonthlySum = +(gross * 12).toFixed(2);
      monthlyEfkaEmployeeSum = +(efkaEmployee * 12).toFixed(2);
      monthlyEfkaEmployerSum = +(efkaEmployer * 12).toFixed(2);
      annualGross14 = +(gross * MONTHS_PER_YEAR + benefitsTotal * 12).toFixed(2);
      annualEfka14 = +(efkaEmployee * MONTHS_PER_YEAR).toFixed(2);
    }

    // Surcharges (4.166% leave allowance surcharge on bonuses)
    const christmasSurcharge = +(christmasGrossBase * LEAVE_SURCHARGE_RATE).toFixed(2);
    const christmasGrossTotal = +(christmasGrossBase + christmasSurcharge).toFixed(2);

    const easterSurcharge = +(easterGrossBase * LEAVE_SURCHARGE_RATE).toFixed(2);
    const easterGrossTotal = +(easterGrossBase + easterSurcharge).toFixed(2);

    // EFKA on actual bonus amounts (with surcharges)
    const christmasEfka = +(Math.min(christmasGrossTotal, MAX_INSURABLE_EARNINGS) * EFKA_EMPLOYEE_RATE).toFixed(2);
    const easterEfka = +(Math.min(easterGrossTotal, MAX_INSURABLE_EARNINGS) * EFKA_EMPLOYEE_RATE).toFixed(2);
    const leaveEfka = +(Math.min(leaveGrossBase, MAX_INSURABLE_EARNINGS) * EFKA_EMPLOYEE_RATE).toFixed(2);

    // Tax calculation on 14-month base
    const taxableIncome = +(annualGross14 - annualEfka14).toFixed(2);
    const childrenIdx = Math.min(params.children, 6);
    const brackets = TAX_RATES[params.ageGroup];
    const { totalTax, breakdown } = this.calculateTax(
      taxableIncome, brackets, childrenIdx
    );
    const taxDiscount = this.getTaxDiscount(params.children, taxableIncome);
    const annualTax = Math.max(0, +(totalTax - taxDiscount).toFixed(2));

    // Tax distribution: proportional across 14 payment units
    const monthlyTax = +(annualTax / MONTHS_PER_YEAR).toFixed(2);
    const netMonthly = +(gross - efkaEmployee - monthlyTax).toFixed(2);

    // Before/after monthly breakdowns when salary change is active
    // Each period shows the tax as if that salary applied all year (what you see on the payslip)
    let previousMonthly: MonthlyBreakdown | undefined;
    let currentMonthly: MonthlyBreakdown | undefined;
    if (params.salaryChange) {
      const oldGross = Math.max(0, params.salaryChange.previousGross);
      const oldEfka = +(Math.min(oldGross, MAX_INSURABLE_EARNINGS) * EFKA_EMPLOYEE_RATE).toFixed(2);
      const oldMonthlyTax = this.calculateMonthlyTax(oldGross, oldEfka, benefitsTotal, childrenIdx, brackets, params.children);
      previousMonthly = {
        grossMonthly: oldGross,
        efkaEmployee: oldEfka,
        incomeTax: oldMonthlyTax,
        netMonthly: +(oldGross - oldEfka - oldMonthlyTax).toFixed(2),
      };
      const newMonthlyTax = this.calculateMonthlyTax(gross, efkaEmployee, benefitsTotal, childrenIdx, brackets, params.children);
      currentMonthly = {
        grossMonthly: gross,
        efkaEmployee: efkaEmployee,
        incomeTax: newMonthlyTax,
        netMonthly: +(gross - efkaEmployee - newMonthlyTax).toFixed(2),
      };
    }

    // Bonus taxes: Christmas = 1 unit, Easter = 0.5 units, Leave = 0.5 units
    const christmasTax = monthlyTax;
    const christmasNet = +(christmasGrossTotal - christmasEfka - christmasTax).toFixed(2);

    const easterTax = +(monthlyTax / 2).toFixed(2);
    const easterNet = +(easterGrossTotal - easterEfka - easterTax).toFixed(2);

    const leaveTax = +(monthlyTax / 2).toFixed(2);
    const leaveNet = +(leaveGrossBase - leaveEfka - leaveTax).toFixed(2);

    // Actual annual totals (with surcharges)
    const annualGross = +(regularMonthlySum + christmasGrossTotal + easterGrossTotal + leaveGrossBase + benefitsTotal * 12).toFixed(2);
    const annualEfka = +(monthlyEfkaEmployeeSum + christmasEfka + easterEfka + leaveEfka).toFixed(2);
    const annualNet = +(annualGross - annualEfka - annualTax).toFixed(2);

    // Employer cost
    const christmasEmployerEfka = +(Math.min(christmasGrossTotal, MAX_INSURABLE_EARNINGS) * EFKA_EMPLOYER_RATE).toFixed(2);
    const easterEmployerEfka = +(Math.min(easterGrossTotal, MAX_INSURABLE_EARNINGS) * EFKA_EMPLOYER_RATE).toFixed(2);
    const leaveEmployerEfka = +(Math.min(leaveGrossBase, MAX_INSURABLE_EARNINGS) * EFKA_EMPLOYER_RATE).toFixed(2);
    const employerMonthly = +(gross + efkaEmployer).toFixed(2);
    const employerAnnual = +(regularMonthlySum + monthlyEfkaEmployerSum + christmasGrossTotal + christmasEmployerEfka + easterGrossTotal + easterEmployerEfka + leaveGrossBase + leaveEmployerEfka).toFixed(2);

    const christmasBonus: BonusBreakdown = {
      grossBase: christmasGrossBase,
      leaveSurcharge: christmasSurcharge,
      grossTotal: christmasGrossTotal,
      efka: christmasEfka,
      tax: christmasTax,
      net: christmasNet,
    };

    const easterBonus: BonusBreakdown = {
      grossBase: easterGrossBase,
      leaveSurcharge: easterSurcharge,
      grossTotal: easterGrossTotal,
      efka: easterEfka,
      tax: easterTax,
      net: easterNet,
    };

    const leaveAllowance: BonusBreakdown = {
      grossBase: leaveGrossBase,
      leaveSurcharge: 0,
      grossTotal: leaveGrossBase,
      efka: leaveEfka,
      tax: leaveTax,
      net: leaveNet,
    };

    return {
      grossMonthly: gross,
      efkaEmployee,
      efkaEmployeeRate: EFKA_EMPLOYEE_RATE * 100,
      incomeTax: monthlyTax,
      netMonthly,
      previousMonthly,
      currentMonthly,
      annualGross,
      annualEfka,
      annualTax,
      annualNet,
      christmasBonus,
      easterBonus,
      leaveAllowance,
      employerMonthly,
      efkaEmployer,
      efkaEmployerRate: EFKA_EMPLOYER_RATE * 100,
      employerAnnual,
      taxBreakdown: breakdown,
      taxDiscount,
      taxableIncome,
    };
  }

  /**
   * Reverse calculation: given net monthly salary, find the gross.
   * Uses binary search for precision.
   */
  reverseCalculate(netTarget: number, params: Omit<SalaryParams, 'grossMonthly'>): number {
    if (netTarget <= 0) return 0;

    let lo = netTarget;
    let hi = netTarget * 3;

    // Ensure hi is high enough
    for (let i = 0; i < 10; i++) {
      const result = this.calculate({ ...params, grossMonthly: hi });
      if (result.netMonthly >= netTarget) break;
      hi *= 2;
    }

    // Binary search
    for (let i = 0; i < 100; i++) {
      const mid = (lo + hi) / 2;
      const result = this.calculate({ ...params, grossMonthly: mid });
      if (Math.abs(result.netMonthly - netTarget) < 0.005) {
        return +mid.toFixed(2);
      }
      if (result.netMonthly < netTarget) {
        lo = mid;
      } else {
        hi = mid;
      }
    }

    return +((lo + hi) / 2).toFixed(2);
  }

  /**
   * Calculate pro-rata weighted gross salary for a bonus period.
   * Returns the weighted average gross based on days at each salary.
   */
  private getProRataGross(
    periodStartMonth: number,
    periodEndMonth: number,
    changeMonth: number,
    oldGross: number,
    newGross: number,
    cumDays: number[],
  ): number {
    const periodStart = cumDays[periodStartMonth - 1];
    const periodEnd = cumDays[periodEndMonth];
    const totalDays = periodEnd - periodStart;

    const changeDay = cumDays[changeMonth - 1];

    if (changeDay <= periodStart) return newGross;
    if (changeDay >= periodEnd) return oldGross;

    const daysOld = changeDay - periodStart;
    const daysNew = periodEnd - changeDay;
    return (daysOld / totalDays) * oldGross + (daysNew / totalDays) * newGross;
  }

  /**
   * Cumulative days from start of year, accounting for leap years.
   * Index 0 = Jan 1 (day 0), Index 12 = end of Dec (day 365 or 366).
   */
  private getCumulativeDays(year: number): number[] {
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    if (isLeap) {
      return [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335, 366];
    }
    return [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365];
  }

  /**
   * Calculate monthly tax as if a given gross salary applied for the full year (14 months).
   * Used for before/after monthly breakdowns so each shows the standalone payslip tax.
   */
  private calculateMonthlyTax(
    grossMonthly: number,
    efkaMonthly: number,
    benefitsTotal: number,
    childrenIdx: number,
    brackets: number[][],
    children: number,
  ): number {
    const annualGross14 = +(grossMonthly * MONTHS_PER_YEAR + benefitsTotal * 12).toFixed(2);
    const annualEfka14 = +(efkaMonthly * MONTHS_PER_YEAR).toFixed(2);
    const taxableIncome = +(annualGross14 - annualEfka14).toFixed(2);
    const { totalTax } = this.calculateTax(taxableIncome, brackets, childrenIdx);
    const taxDiscount = this.getTaxDiscount(children, taxableIncome);
    const annualTax = Math.max(0, +(totalTax - taxDiscount).toFixed(2));
    return +(annualTax / MONTHS_PER_YEAR).toFixed(2);
  }

  private calculateTax(
    taxableIncome: number,
    brackets: number[][],
    childrenIdx: number,
  ): { totalTax: number; breakdown: TaxBracketResult[] } {
    const breakdown: TaxBracketResult[] = [];
    let remaining = taxableIncome;
    let totalTax = 0;

    for (let i = 0; i < brackets.length; i++) {
      const from = i === 0 ? 0 : BRACKET_LIMITS[i - 1];
      const to = i < BRACKET_LIMITS.length ? BRACKET_LIMITS[i] : null;
      const rate = brackets[i][childrenIdx];
      const bracketSize = to !== null ? to - from : Infinity;
      const taxableInBracket = Math.min(Math.max(0, remaining), bracketSize);

      if (taxableInBracket > 0 || remaining > 0) {
        const tax = +(taxableInBracket * rate).toFixed(2);
        totalTax += tax;
        breakdown.push({
          from,
          to,
          rate: rate * 100,
          taxableAmount: taxableInBracket,
          tax,
        });
      }

      remaining -= bracketSize;
      if (remaining <= 0) break;
    }

    return { totalTax: +totalTax.toFixed(2), breakdown };
  }

  private getTaxDiscount(children: number, taxableIncome: number): number {
    let baseDiscount: number;
    if (children <= 5) {
      baseDiscount = BASE_TAX_DISCOUNTS[children];
    } else {
      baseDiscount = 1780 + 220 * (children - 5);
    }

    // Reduction: 20€ per 1,000€ above 12,000€
    if (taxableIncome > 12000) {
      const excess = taxableIncome - 12000;
      const reduction = (excess / 1000) * 20;
      baseDiscount = Math.max(0, baseDiscount - reduction);
    }

    return +baseDiscount.toFixed(2);
  }
}
