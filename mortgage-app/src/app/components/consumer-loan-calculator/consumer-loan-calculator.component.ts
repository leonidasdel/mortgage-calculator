import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { AmortizationRow } from '../../models/mortgage.models';
import { CalculatorPersistenceService } from '../../services/calculator-persistence.service';
import { MortgageCalculatorService } from '../../services/mortgage-calculator.service';

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
  seppe: number;
}

interface ConsumerLoanModel {
  loanAmount: number;
  interestRate: number;
  loanMonths: number;
  loanFees: number;
}

import { CommonModule } from '@angular/common';
import { EuroPipe } from '../../pipes/euro.pipe';
import { AmortizationChartComponent } from '../amortization-chart/amortization-chart.component';
import { AmortizationTableComponent } from '../amortization-table/amortization-table.component';
import { CalcExplanationComponent } from '../calc-explanation/calc-explanation.component';
import { ExportRowComponent } from '../export-row/export-row.component';
import { LawFooterComponent } from '../law-footer/law-footer.component';
@Component({
  selector: 'app-consumer-loan-calculator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormField, EuroPipe, AmortizationChartComponent, AmortizationTableComponent, CalcExplanationComponent, ExportRowComponent, LawFooterComponent],
  templateUrl: './consumer-loan-calculator.component.html',
  styleUrl: './consumer-loan-calculator.component.scss',
})
export class ConsumerLoanCalculatorComponent {
  formModel = signal<ConsumerLoanModel>({
    loanAmount: 10000,
    interestRate: 13,
    loanMonths: 48,
    loanFees: 0,
  });
  formFields = form(this.formModel);

  private readonly destroyRef = inject(DestroyRef);
  private readonly persistence = inject(CalculatorPersistenceService);
  private readonly calc = inject(MortgageCalculatorService);

  readonly quickDurations = [12, 24, 36, 48, 60, 84];

  readonly explanationSteps = [
    'Η μηνιαία δόση υπολογίζεται με τύπο PMT (ίσες δόσεις).',
    'Προστίθεται εισφορά Ν.128/1975 0,60% επί του ανεξόφλητου κεφαλαίου.',
    'Το πραγματικό επιτόκιο = ονομαστικό + 0,60% εισφορά.',
    'Το ΣΕΠΠΕ (APR) περιλαμβάνει τόκους, εισφορά και εφάπαξ έξοδα.',
  ];

  readonly explanationFormula =
    'Δόση = PMT(κεφάλαιο, ονομαστικό + 0,60%, μήνες) · Σύνολο = δόσεις + έξοδα';

  constructor() {
    this.persistence.initSignalForm(this.formModel, STORAGE_KEY, this.destroyRef);
  }

  schedule = computed<AmortizationRow[]>(() => {
    const { loanAmount, interestRate, loanMonths } = this.formModel();
    return this.buildSchedule(loanAmount, interestRate, Math.max(1, Math.round(loanMonths)));
  });

  summary = computed<ConsumerLoanSummary>(() => {
    const rows = this.schedule();
    const { loanAmount, interestRate, loanMonths, loanFees } = this.formModel();
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

  shareSummary = computed(() => {
    const s = this.summary();
    return `Καταναλωτικό δάνειο Salaries.gr: δόση ${s.monthlyPayment.toFixed(2)}€/μήνα, σύνολο ${s.grandTotal.toFixed(2)}€`;
  });

  setMonths(m: number): void {
    this.formModel.update(v => ({ ...v, loanMonths: m }));
  }

  print(): void {
    window.print();
  }

  private buildSchedule(loanAmount: number, interestRate: number, months: number): AmortizationRow[] {
    if (loanAmount <= 0 || months <= 0) return [];
    const effectiveRate = interestRate + N128_RATE * 100;
    const monthly = this.calc.pmt(loanAmount, effectiveRate, months);
    const mRate   = interestRate / 100 / 12;
    const mN128   = N128_RATE / 12;
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

  private calcSEPPE(loanAmount: number, fees: number, payment: number, months: number): number {
    if (loanAmount <= 0 || payment <= 0 || months <= 0) return 0;
    const net = loanAmount - fees;
    if (net <= 0) return 0;

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
    return (Math.pow(1 + r, 12) - 1) * 100;
  }
}
