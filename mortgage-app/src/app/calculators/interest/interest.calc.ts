export const INTEREST_TAX_RATE = 0.15;

export interface InterestParams {
  capital?: number;
  rate?: number;
  startDate?: string;
  endDate?: string;
}

export interface InterestResult {
  days: number;
  capital: number;
  grossInterest: number;
  tax: number;
  netInterest: number;
  totalAmount: number;
  effectiveRate: number;
  dailyInterest: number;
  taxRate: number;
}

export function calculateInterest(params: InterestParams): InterestResult {
  const capital = Math.max(0, params.capital || 0);
  const rate = Math.max(0, params.rate || 0) / 100;

  const start = new Date(params.startDate ?? '');
  const end = new Date(params.endDate ?? '');
  const days = Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

  const grossInterest = +(capital * (rate / 365) * days).toFixed(2);
  const tax = +(grossInterest * INTEREST_TAX_RATE).toFixed(2);
  const netInterest = +(grossInterest - tax).toFixed(2);
  const totalAmount = +(capital + netInterest).toFixed(2);
  const effectiveRate =
    days > 0 && capital > 0 ? +((netInterest / capital) * (365 / days) * 100).toFixed(2) : 0;
  const dailyInterest = days > 0 ? +(grossInterest / days).toFixed(4) : 0;

  return {
    days,
    capital,
    grossInterest,
    tax,
    netInterest,
    totalAmount,
    effectiveRate,
    dailyInterest,
    taxRate: INTEREST_TAX_RATE * 100,
  };
}
