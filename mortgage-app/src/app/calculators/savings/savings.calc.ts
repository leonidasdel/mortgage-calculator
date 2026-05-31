export interface SavingsYearRow {
  year: number;
  totalContributed: number;
  yearlyGains: number;
  gains: number;
  totalValue: number;
  realValue: number | null;
}

export interface SavingsParams {
  initialDeposit?: number;
  monthlyContribution?: number;
  annualReturn?: number;
  durationYears?: number;
  applyTax?: boolean;
  taxRate?: number;
  applyInflation?: boolean;
  inflationRate?: number;
}

export interface SavingsResult {
  finalNominal: number;
  finalReal: number | null;
  totalContributed: number;
  grossGains: number;
  totalTax: number;
  netGains: number;
  yearlyRows: SavingsYearRow[];
  applyTax: boolean;
  applyInflation: boolean;
}

export function calculateSavings(params: SavingsParams, monthlyOverride?: number): SavingsResult {
  const P = Math.max(0, Number(params.initialDeposit) || 0);
  const C = monthlyOverride ?? Math.max(0, Number(params.monthlyContribution) || 0);
  const annualRate = Math.max(0, Number(params.annualReturn) || 0) / 100;
  const years = Math.max(1, Math.min(50, Math.round(Number(params.durationYears) || 20)));
  const doTax = !!params.applyTax;
  const taxRate = doTax ? Math.max(0, Number(params.taxRate) || 15) / 100 : 0;
  const doInflation = !!params.applyInflation;
  const inflRate = doInflation ? Math.max(0, Number(params.inflationRate) || 0) / 100 : 0;

  const netAnnual = annualRate * (1 - taxRate);
  const mRate = netAnnual / 12;

  const rows: SavingsYearRow[] = [];
  let balance = P;
  let prevGains = 0;

  for (let y = 1; y <= years; y++) {
    for (let m = 0; m < 12; m++) {
      balance = balance * (1 + mRate) + C;
    }
    const contributed = P + C * 12 * y;
    const gains = balance - contributed;
    const yearlyGains = gains - prevGains;
    prevGains = gains;
    const realValue = doInflation ? balance / Math.pow(1 + inflRate, y) : null;
    rows.push({
      year: y,
      totalContributed: contributed,
      yearlyGains,
      gains,
      totalValue: balance,
      realValue,
    });
  }

  const mGross = annualRate / 12;
  let grossBal = P;
  for (let y = 0; y < years; y++) {
    for (let m = 0; m < 12; m++) {
      grossBal = grossBal * (1 + mGross) + C;
    }
  }
  const totalContributed = P + C * 12 * years;
  const grossGains = grossBal - totalContributed;
  const totalTax = grossGains - (balance - totalContributed);
  const netGains = balance - totalContributed;
  const finalReal = doInflation ? balance / Math.pow(1 + inflRate, years) : null;

  return {
    finalNominal: balance,
    finalReal,
    totalContributed,
    grossGains,
    totalTax: Math.max(0, totalTax),
    netGains,
    yearlyRows: rows,
    applyTax: doTax,
    applyInflation: doInflation,
  };
}
