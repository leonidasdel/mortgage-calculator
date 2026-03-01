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

  readonly quickPicks = [
    { label: '3μ', months: 3 },
    { label: '6μ', months: 6 },
    { label: '1ε', months: 12 },
    { label: '2ε', months: 24 },
    { label: '3ε', months: 36 },
    { label: '5ε', months: 60 },
  ];
  activeDuration = signal<number | null>(12);
  durationValue = signal<number>(1);
  durationUnit = signal<'months' | 'years'>('years');
  showCustomEndDate = signal(false);

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
    this.detectActiveDuration();
    this.form.valueChanges.subscribe(() => this.saveState());
    // Clear active pill when user manually edits dates
    this.form.get('startDate')!.valueChanges.subscribe(() => this.detectActiveDuration());
    this.form.get('endDate')!.valueChanges.subscribe(() => this.detectActiveDuration());
  }

  pickDuration(months: number): void {
    this.applyMonths(months);
    this.activeDuration.set(months);
    this.syncDurationInput(months);
  }

  onDurationInput(value: number): void {
    this.durationValue.set(value);
    this.applyCustomDuration();
  }

  onDurationUnitChange(unit: 'months' | 'years'): void {
    this.durationUnit.set(unit);
    this.applyCustomDuration();
  }

  private applyCustomDuration(): void {
    const val = this.durationValue();
    const unit = this.durationUnit();
    if (!val || val <= 0) return;
    const totalMonths = unit === 'years' ? val * 12 : val;
    // For fractional months, use days (30.44 days/month average)
    const wholeMonths = Math.floor(totalMonths);
    const fractionalDays = Math.round((totalMonths - wholeMonths) * 30.44);
    const start = new Date(this.form.value.startDate);
    if (isNaN(start.getTime())) return;
    const end = new Date(start);
    end.setMonth(end.getMonth() + wholeMonths);
    end.setDate(end.getDate() + fractionalDays);
    this.form.patchValue({ endDate: this.formatDate(end) });
    // Check if this matches a quick pick
    this.detectActiveDuration();
  }

  private applyMonths(months: number): void {
    const start = new Date(this.form.value.startDate);
    if (isNaN(start.getTime())) return;
    const end = new Date(start);
    end.setMonth(end.getMonth() + months);
    this.form.patchValue({ endDate: this.formatDate(end) });
  }

  private detectActiveDuration(): void {
    const start = new Date(this.form.value.startDate);
    const end = new Date(this.form.value.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      this.activeDuration.set(null);
      return;
    }
    for (const d of this.quickPicks) {
      const expected = new Date(start);
      expected.setMonth(expected.getMonth() + d.months);
      if (this.formatDate(expected) === this.formatDate(end)) {
        this.activeDuration.set(d.months);
        this.syncDurationInput(d.months);
        return;
      }
    }
    this.activeDuration.set(null);
    // Best-effort sync for non-standard durations
    const diffMs = end.getTime() - start.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    const approxMonths = diffDays / 30.44;
    if (approxMonths >= 12 && Math.abs(approxMonths % 12) < 0.5) {
      this.durationValue.set(Math.round(approxMonths / 12 * 10) / 10);
      this.durationUnit.set('years');
    } else {
      this.durationValue.set(Math.round(approxMonths * 10) / 10);
      this.durationUnit.set('months');
    }
  }

  private syncDurationInput(months: number): void {
    if (months % 12 === 0) {
      this.durationValue.set(months / 12);
      this.durationUnit.set('years');
    } else {
      this.durationValue.set(months);
      this.durationUnit.set('months');
    }
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
