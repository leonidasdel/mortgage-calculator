import { getRentalTaxBrackets, RentalTaxBracket } from '../../constants/rental-tax.constants';

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
  taxYear?: number;
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

function applyBrackets(
  taxableIncome: number,
  brackets: RentalTaxBracket[],
): {
  bracketRows: TaxBracketRow[];
  totalTax: number;
} {
  const bracketRows: TaxBracketRow[] = [];
  let remaining = taxableIncome;
  let totalTax = 0;

  for (const b of brackets) {
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

  return { bracketRows, totalTax };
}

export function calculateRentalTax(params: RentalTaxParams): RentalTaxResult {
  const taxYear = params.taxYear ?? 2026;
  const annualIncome =
    params.incomeMode === 'monthly'
      ? +(Math.max(0, params.monthlyIncome || 0) * 12).toFixed(2)
      : Math.max(0, params.annualIncome || 0);

  const expensesDeduction =
    params.expenseMethod === 'automatic'
      ? annualIncome * 0.05
      : Math.max(0, Math.min(params.actualExpenses || 0, annualIncome));

  const taxableIncome = Math.max(0, annualIncome - expensesDeduction);
  const { bracketRows, totalTax: rawTax } = applyBrackets(
    taxableIncome,
    getRentalTaxBrackets(taxYear),
  );
  const totalTax = +rawTax.toFixed(2);

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
