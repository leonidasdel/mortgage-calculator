import { Component, computed, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

const STORAGE_KEY = 'interestCalcState';
const TAX_RATE = 0.15;

interface InterestResult {
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

@Component({
  selector: 'app-interest-calculator',
  standalone: false,
  templateUrl: './interest-calculator.component.html',
  styleUrl: './interest-calculator.component.scss',
})
export class InterestCalculatorComponent implements OnInit {
  form: FormGroup;
  private formValues;

  constructor(private fb: FormBuilder) {
    const today = new Date();
    const oneYearLater = new Date(today);
    oneYearLater.setFullYear(today.getFullYear() + 1);

    this.form = this.fb.group({
      capital: [10000],
      rate: [3.5],
      startDate: [this.formatDate(today)],
      endDate: [this.formatDate(oneYearLater)],
    });

    this.formValues = toSignal(this.form.valueChanges, { initialValue: this.form.value });
  }

  ngOnInit(): void {
    this.loadState();
    this.form.valueChanges.subscribe(() => this.saveState());
  }

  result = computed<InterestResult>(() => {
    this.formValues();
    const fv = this.form.value;
    const capital = Math.max(0, fv.capital || 0);
    const rate = Math.max(0, fv.rate || 0) / 100;

    const start = new Date(fv.startDate);
    const end = new Date(fv.endDate);
    const days = Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    const grossInterest = +(capital * (rate / 365) * days).toFixed(2);
    const tax = +(grossInterest * TAX_RATE).toFixed(2);
    const netInterest = +(grossInterest - tax).toFixed(2);
    const totalAmount = +(capital + netInterest).toFixed(2);
    const effectiveRate = days > 0 && capital > 0
      ? +((netInterest / capital) * (365 / days) * 100).toFixed(2)
      : 0;
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
      taxRate: TAX_RATE * 100,
    };
  });

  private formatDate(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.form.value));
    } catch { /* storage unavailable */ }
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
