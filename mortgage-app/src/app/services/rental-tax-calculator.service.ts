import { Injectable } from '@angular/core';

const RENTAL_TAX_BRACKETS: { from: number; to: number | null; rate: number }[] = [
  { from: 0, to: 12000, rate: 0.15 },
  { from: 12000, to: 35000, rate: 0.35 },
  { from: 35000, to: null, rate: 0.45 },
];

export interface TaxBracketRow {
  from: number;
  to: number | null;
  rate: number;
  taxableAmount: number;
  tax: number;
}

export interface RentalTaxParams {
  incomeMode: 'annual' | 'monthly';
  annualIncome: number;
  monthlyIncome: number;
  expenseMethod: 'automatic' | 'actual';
  actualExpenses: number;
}

export interface RentalTaxResult {
  annualIncome: number;
  expensesDeduction: number;
  taxableIncome: number;
  bracketRows: TaxBracketRow[];
  totalTax: number;
  effectiveRate: number;
  netAnnual: number;
  netMonthly: number;
}

@Injectable({ providedIn: 'root' })
export class RentalTaxCalculatorService {
  calculate(params: RentalTaxParams): RentalTaxResult {
    const annualIncome = params.incomeMode === 'monthly'
      ? +(Math.max(0, params.monthlyIncome || 0) * 12).toFixed(2)
      : Math.max(0, params.annualIncome || 0);

    const expensesDeduction = params.expenseMethod === 'automatic'
      ? annualIncome * 0.05
      : Math.max(0, Math.min(params.actualExpenses || 0, annualIncome));

    const taxableIncome = Math.max(0, annualIncome - expensesDeduction);
    const bracketRows: TaxBracketRow[] = [];
    let remaining = taxableIncome;
    let totalTax = 0;

    for (const b of RENTAL_TAX_BRACKETS) {
      const width = b.to !== null ? b.to - b.from : Infinity;
      const taxable = Math.min(Math.max(0, remaining), width);
      if (taxable > 0) {
        const tax = taxable * b.rate;
        totalTax += tax;
        bracketRows.push({ from: b.from, to: b.to, rate: b.rate, taxableAmount: taxable, tax });
      }
      remaining -= width;
      if (remaining <= 0) break;
    }

    const effectiveRate = taxableIncome > 0 ? (totalTax / taxableIncome) * 100 : 0;
    const netAnnual = annualIncome - totalTax;
    return {
      annualIncome,
      expensesDeduction,
      taxableIncome,
      bracketRows,
      totalTax,
      effectiveRate,
      netAnnual,
      netMonthly: netAnnual / 12,
    };
  }
}
