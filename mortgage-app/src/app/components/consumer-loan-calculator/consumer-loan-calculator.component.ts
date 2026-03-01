import { Component, computed, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { AmortizationRow } from '../../models/mortgage.models';

const STORAGE_KEY = 'consumerLoanCalcState';
const N128_RATE = 0.006; // 0.60% per annum — Εισφορά Ν.128/1975 for consumer loans

interface ConsumerLoanSummary {
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
  seppe: number; // ΣΕΠΠΕ (APR) — true annualized cost including fees
}

@Component({
  selector: 'app-consumer-loan-calculator',
  standalone: false,
  templateUrl: './consumer-loan-calculator.component.html',
  styleUrl: './consumer-loan-calculator.component.scss',
})
export class ConsumerLoanCalculatorComponent implements OnInit {
  form: FormGroup;
  private formValues;

  readonly quickDurations = [12, 24, 36, 48, 60, 84];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      loanAmount:   [10000],
      interestRate: [13],
      loanMonths:   [48],
      loanFees:     [0],
    });
    this.formValues = toSignal(this.form.valueChanges, { initialValue: this.form.value });
  }

  ngOnInit(): void {
    this.loadState();
    this.form.valueChanges.subscribe(() => this.saveState());
  }

  schedule = computed<AmortizationRow[]>(() => {
    this.formValues();
    const { loanAmount, interestRate, loanMonths } = this.form.value;
    return this.buildSchedule(loanAmount, interestRate, Math.max(1, Math.round(loanMonths)));
  });

  summary = computed<ConsumerLoanSummary>(() => {
    const rows = this.schedule();
    const { loanAmount, interestRate, loanMonths, loanFees } = this.form.value;
    const effectiveRate  = interestRate + N128_RATE * 100;
    const totalPrincipal = rows.reduce((s, r) => s + r.principal, 0);
    const totalInterest  = rows.reduce((s, r) => s + r.interest, 0);
    const totalN128      = rows.reduce((s, r) => s + r.n128, 0);
    const fees           = Math.max(0, loanFees || 0);
    const monthlyPayment = rows.length > 0 ? rows[0].payment : 0;
    const grandTotal     = totalPrincipal + totalInterest + totalN128 + fees;
    const months         = Math.max(1, Math.round(loanMonths));
    const seppe          = this.calcSEPPE(loanAmount, fees, monthlyPayment, months);
    return { loanAmount, interestRate, effectiveRate, loanMonths: months, loanFees: fees, monthlyPayment, totalPrincipal, totalInterest, totalN128, grandTotal, seppe };
  });

  setMonths(m: number): void {
    this.form.patchValue({ loanMonths: m });
  }

  print(): void {
    window.print();
  }

  private pmt(principal: number, annualRate: number, months: number): number {
    if (principal <= 0 || months <= 0) return 0;
    if (annualRate === 0) return principal / months;
    const r = annualRate / 100 / 12;
    const f = Math.pow(1 + r, months);
    return principal * r * f / (f - 1);
  }

  private buildSchedule(loanAmount: number, interestRate: number, months: number): AmortizationRow[] {
    if (loanAmount <= 0 || months <= 0) return [];
    const effectiveRate = interestRate + N128_RATE * 100; // nominal + 0.60% levy
    const monthly = this.pmt(loanAmount, effectiveRate, months);
    const mRate   = interestRate / 100 / 12;
    const mN128   = N128_RATE / 12; // monthly levy rate on declining balance
    const today   = new Date();
    let balance   = loanAmount;
    const rows: AmortizationRow[] = [];

    for (let m = 1; m <= months; m++) {
      if (balance < 0.005) break;
      const interest  = balance * mRate;
      const n128      = balance * mN128;
      const principal = Math.min(Math.max(0, monthly - interest - n128), balance);
      const newBalance = Math.max(0, balance - principal);
      const date = new Date(today.getFullYear(), today.getMonth() + m, today.getDate());
      rows.push({ month: m, date, payment: monthly, principal, interest, n128, earlyAmt: 0, balance: newBalance, isGrace: false, isFixed: true, rate: interestRate });
      balance = newBalance;
    }
    return rows;
  }

  /** ΣΕΠΠΕ (APR) — Συνολικό Ετήσιο Πραγματικό Ποσοστό Επιβάρυνσης.
   *  Solves for the annual rate r such that:
   *    netProceeds = Σ payment / (1 + r/12)^i   for i = 1..months
   *  where netProceeds = loanAmount − upfrontFees.
   *  Uses Newton-Raphson iteration. */
  private calcSEPPE(loanAmount: number, fees: number, payment: number, months: number): number {
    if (loanAmount <= 0 || payment <= 0 || months <= 0) return 0;
    const net = loanAmount - fees; // net amount received by borrower
    if (net <= 0) return 0;

    // Initial guess: effective monthly rate from PMT formula inverted
    let r = payment > 0 ? (payment / net - 1 / months) * 2 : 0.01;
    if (r <= 0) r = 0.01;

    for (let iter = 0; iter < 100; iter++) {
      let pv = 0, dpv = 0;
      for (let i = 1; i <= months; i++) {
        const d = Math.pow(1 + r, i);
        pv  += payment / d;
        dpv -= i * payment / (d * (1 + r));
      }
      const f = pv - net;
      const df = dpv;
      if (Math.abs(df) < 1e-15) break;
      const step = f / df;
      r -= step;
      if (r <= 0) r = 0.0001;
      if (Math.abs(step) < 1e-10) break;
    }
    return r * 12 * 100; // convert monthly rate to annual percentage
  }

  private saveState(): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.form.value)); } catch { /* ignore */ }
  }

  private loadState(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const state = JSON.parse(raw);
      if (state) this.form.patchValue(state, { emitEvent: false });
    } catch { /* ignore */ }
  }
}
