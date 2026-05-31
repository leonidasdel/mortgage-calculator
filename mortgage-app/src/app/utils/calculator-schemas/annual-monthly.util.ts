export interface AnnualMonthlyValues {
  annual: number;
  monthly: number;
}

export function syncAnnualFromMonthly(monthly: number): AnnualMonthlyValues {
  const m = Math.max(0, Number(monthly) || 0);
  return { annual: +(m * 12).toFixed(2), monthly: m };
}

export function syncMonthlyFromAnnual(annual: number): AnnualMonthlyValues {
  const a = Math.max(0, Number(annual) || 0);
  return { annual: a, monthly: +(a / 12).toFixed(2) };
}
