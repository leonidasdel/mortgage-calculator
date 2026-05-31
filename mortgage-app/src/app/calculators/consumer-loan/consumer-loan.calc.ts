import { AmortizationRow } from '../../models/mortgage.models';
import { mortgagePmt } from '../mortgage/mortgage.calc';

const N128_RATE = 0.006; // 0.60% per annum — Εισφορά Ν.128/1975 for consumer loans

export interface ConsumerLoanParams {
  loanAmount: number;
  interestRate: number;
  loanMonths: number;
  loanFees: number;
}

export interface ConsumerLoanSummary {
  loanAmount: number;
  interestRate: number;
  effectiveRate: number;
  loanMonths: number;
  loanFees: number;
  monthlyPayment: number;
  totalPrincipal: number;
  totalInterest: number;
  totalN128: number;
  grandTotal: number;
  seppe: number;
}

export function buildConsumerLoanSchedule(
  loanAmount: number,
  interestRate: number,
  months: number,
): AmortizationRow[] {
  if (loanAmount <= 0 || months <= 0) return [];
  const effectiveRate = interestRate + N128_RATE * 100;
  const monthly = mortgagePmt(loanAmount, effectiveRate, months);
  const mRate = interestRate / 100 / 12;
  const mN128 = N128_RATE / 12;
  const today = new Date();
  let balance = loanAmount;
  const rows: AmortizationRow[] = [];

  for (let m = 1; m <= months; m++) {
    if (balance < 0.005) break;
    const interest = balance * mRate;
    const n128 = balance * mN128;
    const principal = Math.min(Math.max(0, monthly - interest - n128), balance);
    const newBalance = Math.max(0, balance - principal);
    const date = new Date(today.getFullYear(), today.getMonth() + m, today.getDate());
    rows.push({
      month: m,
      date,
      payment: monthly,
      principal,
      interest,
      n128,
      earlyAmt: 0,
      balance: newBalance,
      isGrace: false,
      isFixed: true,
      rate: interestRate,
    });
    balance = newBalance;
  }
  return rows;
}

export function calcConsumerLoanSeppe(
  loanAmount: number,
  fees: number,
  payment: number,
  months: number,
): number {
  if (loanAmount <= 0 || payment <= 0 || months <= 0) return 0;
  const net = loanAmount - fees;
  if (net <= 0) return 0;

  let r = payment > 0 ? (payment / net - 1 / months) * 2 : 0.01;
  if (r <= 0) r = 0.01;

  for (let iter = 0; iter < 100; iter++) {
    let pv = 0,
      dpv = 0;
    for (let i = 1; i <= months; i++) {
      const d = Math.pow(1 + r, i);
      pv += payment / d;
      dpv -= (i * payment) / (d * (1 + r));
    }
    const f = pv - net;
    const df = dpv;
    if (Math.abs(df) < 1e-15) break;
    const step = f / df;
    r -= step;
    if (r <= 0) r = 0.0001;
    if (Math.abs(step) < 1e-10) break;
  }
  return (Math.pow(1 + r, 12) - 1) * 100;
}

export function calculateConsumerLoanSummary(params: ConsumerLoanParams): {
  schedule: AmortizationRow[];
  summary: ConsumerLoanSummary;
} {
  const { loanAmount, interestRate, loanMonths, loanFees } = params;
  const months = Math.max(1, Math.round(loanMonths));
  const schedule = buildConsumerLoanSchedule(loanAmount, interestRate, months);
  const effectiveRate = interestRate + N128_RATE * 100;
  const totalPrincipal = schedule.reduce((s, r) => s + r.principal, 0);
  const totalInterest = schedule.reduce((s, r) => s + r.interest, 0);
  const totalN128 = schedule.reduce((s, r) => s + r.n128, 0);
  const fees = Math.max(0, loanFees || 0);
  const monthlyPayment = schedule.length > 0 ? schedule[0].payment : 0;
  const grandTotal = totalPrincipal + totalInterest + totalN128 + fees;
  const seppe = calcConsumerLoanSeppe(loanAmount, fees, monthlyPayment, months);

  return {
    schedule,
    summary: {
      loanAmount,
      interestRate,
      effectiveRate,
      loanMonths: months,
      loanFees: fees,
      monthlyPayment,
      totalPrincipal,
      totalInterest,
      totalN128,
      grandTotal,
      seppe,
    },
  };
}
