import { AgeGroup } from '../../models/salary.models';
import { calculateTaxOnlySalary } from '../salary/salary.calc';

/** e-EFKΑ 2026 monthly amounts (main pension + health). */
export const EFKA_CATEGORIES = [
  { id: 'special', label: 'Ειδική (νέοι, πρώτα 5 έτη)', monthly: 150.46 },
  { id: 'cat1', label: 'Κατηγορία 1', monthly: 250.77 },
  { id: 'cat2', label: 'Κατηγορία 2', monthly: 300.93 },
  { id: 'cat3', label: 'Κατηγορία 3', monthly: 360.63 },
  { id: 'cat4', label: 'Κατηγορία 4', monthly: 433.47 },
  { id: 'cat5', label: 'Κατηγορία 5', monthly: 519.45 },
  { id: 'cat6', label: 'Κατηγορία 6', monthly: 675.87 },
] as const;

export interface TaxBracketRow {
  from: number;
  to: number | null;
  rate: number;
  taxableAmount: number;
  tax: number;
}

export interface EfkaComparison {
  label: string;
  monthlyEfka: number;
  annualEfka: number;
  incomeTax: number;
  advanceTax: number;
  totalObligations: number;
  netAnnual: number;
  netMonthly: number;
  effectiveRate: number;
  selected: boolean;
}

export interface FreelancerParams {
  annualRevenue: number;
  annualExpenses: number;
  efkaCategory: string;
  yearsActive: string;
  ageGroup: AgeGroup;
  children: number;
}

export interface FreelancerResult {
  annualRevenue: number;
  annualExpenses: number;
  efkaLabel: string;
  monthlyEfka: number;
  annualEfka: number;
  taxableIncome: number;
  bracketRows: TaxBracketRow[];
  grossTax: number;
  taxDiscount: number;
  incomeTax: number;
  advanceTaxRate: number;
  advanceTax: number;
  totalObligations: number;
  netAnnual: number;
  netMonthly: number;
  effectiveRate: number;
  efkaComparison: EfkaComparison[];
}

type CategoryCalc = Omit<
  FreelancerResult,
  'efkaLabel' | 'monthlyEfka' | 'advanceTaxRate' | 'efkaComparison'
>;

function calcForCategory(
  cat: (typeof EFKA_CATEGORIES)[number],
  revenue: number,
  expenses: number,
  children: number,
  advanceRate: number,
  ageGroup: AgeGroup,
): CategoryCalc {
  const annualEfka = +(cat.monthly * 12).toFixed(2);
  const taxableIncome = Math.max(0, revenue - expenses - annualEfka);
  const taxResult = calculateTaxOnlySalary(taxableIncome, 2026, ageGroup, children);
  const incomeTax = taxResult.totalTax;
  const bracketRows: TaxBracketRow[] = taxResult.breakdown.map((b) => ({
    from: b.from,
    to: b.to,
    rate: b.rate / 100,
    taxableAmount: b.taxableAmount,
    tax: b.tax,
  }));
  const advanceTax = incomeTax * advanceRate;
  const totalObligations = annualEfka + incomeTax + advanceTax;
  const netAnnual = revenue - expenses - totalObligations;
  return {
    annualRevenue: revenue,
    annualExpenses: expenses,
    annualEfka,
    taxableIncome,
    bracketRows,
    grossTax: incomeTax,
    taxDiscount: 0,
    incomeTax,
    advanceTax,
    totalObligations,
    netAnnual,
    netMonthly: +(netAnnual / 12).toFixed(2),
    effectiveRate: revenue > 0 ? (totalObligations / revenue) * 100 : 0,
  };
}

export function calculateFreelancer(params: FreelancerParams): FreelancerResult {
  const revenue = Math.max(0, params.annualRevenue || 0);
  const expenses = Math.max(0, params.annualExpenses || 0);
  const catId = params.efkaCategory || 'cat1';
  const advanceRate = params.yearsActive === 'under3' ? 0.275 : 0.55;
  const children = Math.min(Math.max(0, params.children || 0), 6);
  const cat = EFKA_CATEGORIES.find((c) => c.id === catId) ?? EFKA_CATEGORIES[1];

  const calc = calcForCategory(cat, revenue, expenses, children, advanceRate, params.ageGroup);
  const efkaComparison = EFKA_CATEGORIES.map((c) => {
    const r = calcForCategory(c, revenue, expenses, children, advanceRate, params.ageGroup);
    return {
      label: c.label,
      monthlyEfka: c.monthly,
      annualEfka: r.annualEfka,
      incomeTax: r.incomeTax,
      advanceTax: r.advanceTax,
      totalObligations: r.totalObligations,
      netAnnual: r.netAnnual,
      netMonthly: r.netMonthly,
      effectiveRate: r.effectiveRate,
      selected: c.id === catId,
    };
  });

  return {
    ...calc,
    efkaLabel: cat.label,
    monthlyEfka: cat.monthly,
    advanceTaxRate: advanceRate * 100,
    efkaComparison,
  };
}
