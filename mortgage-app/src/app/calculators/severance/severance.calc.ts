const SEVERANCE_TABLE: { years: number; months: number }[] = [
  { years: 0, months: 0 },
  { years: 1, months: 2 },
  { years: 2, months: 2 },
  { years: 3, months: 2 },
  { years: 4, months: 3 },
  { years: 5, months: 3 },
  { years: 6, months: 4 },
  { years: 7, months: 4 },
  { years: 8, months: 5 },
  { years: 9, months: 5 },
  { years: 10, months: 6 },
  { years: 11, months: 7 },
  { years: 12, months: 8 },
  { years: 13, months: 9 },
  { years: 14, months: 10 },
  { years: 15, months: 11 },
  { years: 16, months: 12 },
  { years: 17, months: 13 },
  { years: 18, months: 14 },
  { years: 19, months: 15 },
  { years: 20, months: 16 },
  { years: 21, months: 17 },
  { years: 22, months: 18 },
  { years: 23, months: 19 },
  { years: 24, months: 20 },
  { years: 25, months: 21 },
  { years: 26, months: 22 },
  { years: 27, months: 23 },
  { years: 28, months: 24 },
];

const SEVERANCE_CAP_MONTHS = 24;
const SEVERANCE_TAX_BRACKETS: { upTo: number | null; rate: number }[] = [
  { upTo: 60000, rate: 0 },
  { upTo: 100000, rate: 0.1 },
  { upTo: 150000, rate: 0.2 },
  { upTo: null, rate: 0.3 },
];

export type TerminationType = 'without_notice' | 'with_notice' | 'mutual';

export interface SeveranceParams {
  grossMonthly: number;
  yearsOfService: number;
  monthsExtra?: number;
  terminationType: TerminationType;
}

export interface SeveranceResult {
  completedYears: number;
  noticePeriod: number;
  fullSeveranceMonths: number;
  actualMonths: number;
  grossMonthly: number;
  baseSalaryCalculation: number;
  grossSeverance: number;
  severanceTax: number;
  netSeverance: number;
  isZero: boolean;
  isCapped: boolean;
  terminationType: string;
}

function getSeveranceMonths(completedYears: number): number {
  if (completedYears < 1) return 0;
  if (completedYears >= 28) return SEVERANCE_CAP_MONTHS;
  let months = 0;
  for (const row of SEVERANCE_TABLE) {
    if (row.years <= completedYears) months = row.months;
  }
  return months;
}

function getNoticePeriod(completedYears: number): number {
  if (completedYears < 1) return 0;
  if (completedYears < 2) return 1;
  if (completedYears < 5) return 2;
  if (completedYears < 10) return 3;
  return 4;
}

function calcSeveranceTax(grossSeverance: number): number {
  let previousLimit = 0;
  let tax = 0;

  for (const bracket of SEVERANCE_TAX_BRACKETS) {
    const upper = bracket.upTo ?? Infinity;
    const taxable = Math.min(Math.max(0, grossSeverance - previousLimit), upper - previousLimit);
    if (taxable > 0) tax += taxable * bracket.rate;
    previousLimit = upper;
    if (grossSeverance <= upper) break;
  }

  return +tax.toFixed(2);
}

export function calculateSeverance(params: SeveranceParams): SeveranceResult {
  const gross = Math.max(0, +(params.grossMonthly || 0));
  const years = Math.max(0, Math.floor(+(params.yearsOfService || 0)));
  const months = Math.min(11, Math.max(0, Math.floor(+(params.monthsExtra || 0))));
  const termType = params.terminationType || 'without_notice';

  const completedYears = years + (months >= 12 ? 1 : 0);
  const noticePeriod = getNoticePeriod(completedYears);
  const fullMonths = getSeveranceMonths(completedYears);
  const isCapped = completedYears >= 1 && fullMonths >= SEVERANCE_CAP_MONTHS;

  const actualMonths = termType === 'without_notice' ? fullMonths : fullMonths / 2;

  const baseSalaryCalculation = +((gross * 14) / 12).toFixed(2);
  const grossSeverance = +(actualMonths * baseSalaryCalculation).toFixed(2);
  const severanceTax = calcSeveranceTax(grossSeverance);
  const netSeverance = Math.max(0, +(grossSeverance - severanceTax).toFixed(2));

  return {
    completedYears,
    noticePeriod,
    fullSeveranceMonths: fullMonths,
    actualMonths,
    grossMonthly: gross,
    baseSalaryCalculation,
    grossSeverance,
    severanceTax,
    netSeverance,
    isZero: completedYears < 1,
    isCapped,
    terminationType: termType,
  };
}
