import { computed, inject } from '@angular/core';
import { signalStore, withComputed, withHooks, withState } from '@ngrx/signals';
import { AmortizationRow } from '../../models/mortgage.models';
import { MortgageCalculatorService } from '../../services/mortgage-calculator.service';
import { withCalculatorPersistence } from '../../utils/store-adapters';

const STORAGE_KEY = 'consumerLoanCalcState';
const N128_RATE = 0.006; // 0.60% per annum — Εισφορά Ν.128/1975 for consumer loans

export interface ConsumerLoanModel {
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

const DEFAULT_MODEL: ConsumerLoanModel = {
  loanAmount: 10000,
  interestRate: 13,
  loanMonths: 48,
  loanFees: 0,
};

export const ConsumerLoanStore = signalStore(
  withState({
    formModel: DEFAULT_MODEL,
  }),
  withCalculatorPersistence<ConsumerLoanModel>(STORAGE_KEY),
  withComputed((store, calc = inject(MortgageCalculatorService)) => {
    const schedule = computed<AmortizationRow[]>(() => {
      const { loanAmount, interestRate, loanMonths } = store.formModel();
      return buildSchedule(loanAmount, interestRate, Math.max(1, Math.round(loanMonths)), calc);
    });

    const summary = computed<ConsumerLoanSummary>(() => {
      const rows = schedule();
      const { loanAmount, interestRate, loanMonths, loanFees } = store.formModel();
      const effectiveRate = interestRate + N128_RATE * 100;
      const totalPrincipal = rows.reduce((s, r) => s + r.principal, 0);
      const totalInterest = rows.reduce((s, r) => s + r.interest, 0);
      const totalN128 = rows.reduce((s, r) => s + r.n128, 0);
      const fees = Math.max(0, loanFees || 0);
      const monthlyPayment = rows.length > 0 ? rows[0].payment : 0;
      const grandTotal = totalPrincipal + totalInterest + totalN128 + fees;
      const months = Math.max(1, Math.round(loanMonths));
      const seppe = calcSEPPE(loanAmount, fees, monthlyPayment, months);
      return {
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
      };
    });

    const shareSummary = computed(() => {
      const s = summary();
      return `Καταναλωτικό δάνειο Salaries.gr: δόση ${s.monthlyPayment.toFixed(2)}€/μήνα, σύνολο ${s.grandTotal.toFixed(2)}€`;
    });

    return {
      schedule,
      summary,
      shareSummary,
    };
  }),
  withHooks({
    onInit(store) {
      store.initCalculatorState();
    },
  }),
);

function buildSchedule(
  loanAmount: number,
  interestRate: number,
  months: number,
  calc: MortgageCalculatorService,
): AmortizationRow[] {
  if (loanAmount <= 0 || months <= 0) return [];
  const effectiveRate = interestRate + N128_RATE * 100;
  const monthly = calc.pmt(loanAmount, effectiveRate, months);
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

function calcSEPPE(loanAmount: number, fees: number, payment: number, months: number): number {
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
