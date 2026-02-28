import { Injectable } from '@angular/core';
import {
  AgeGroup,
  SalaryParams,
  SalaryResult,
  TaxBracketResult,
} from '../models/salary.models';

const EFKA_EMPLOYEE_RATE = 0.1337;
const EFKA_EMPLOYER_RATE = 0.2179;
const MAX_INSURABLE_EARNINGS = 7573;
const MONTHS_PER_YEAR = 14; // 12 regular + Christmas + Easter/Leave

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

    // Employee EFKA
    const efkaEmployee = +(totalGrossForInsurance * EFKA_EMPLOYEE_RATE).toFixed(2);
    const efkaEmployer = +(totalGrossForInsurance * EFKA_EMPLOYER_RATE).toFixed(2);

    // Annual calculations (14 months)
    const annualGross = gross * MONTHS_PER_YEAR + benefitsTotal * 12;
    const annualEfka = efkaEmployee * MONTHS_PER_YEAR;
    const taxableIncome = annualGross - annualEfka;

    // Tax calculation
    const childrenIdx = Math.min(params.children, 6);
    const brackets = TAX_RATES[params.ageGroup];
    const { totalTax, breakdown } = this.calculateTax(
      taxableIncome, brackets, childrenIdx
    );
    const taxDiscount = this.getTaxDiscount(params.children, taxableIncome);
    const annualTax = Math.max(0, +(totalTax - taxDiscount).toFixed(2));

    // Monthly tax (spread across 14 months)
    const monthlyTax = +(annualTax / MONTHS_PER_YEAR).toFixed(2);
    const netMonthly = +(gross - efkaEmployee - monthlyTax).toFixed(2);

    // Annual net
    const annualNet = +(annualGross - annualEfka - annualTax).toFixed(2);

    // Bonuses (net amounts)
    const christmasBonus = netMonthly;
    const easterBonus = +(netMonthly / 2).toFixed(2);
    const leaveAllowance = +(netMonthly / 2).toFixed(2);

    // Employer cost
    const employerMonthly = +(gross + efkaEmployer).toFixed(2);
    const employerAnnual = +(employerMonthly * MONTHS_PER_YEAR).toFixed(2);

    return {
      grossMonthly: gross,
      efkaEmployee,
      efkaEmployeeRate: EFKA_EMPLOYEE_RATE * 100,
      incomeTax: monthlyTax,
      netMonthly,
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
