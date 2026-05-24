import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { CalculatorPersistenceService } from '../../services/calculator-persistence.service';
import {
  InterestCalculatorService,
  InterestResult,
} from '../../services/interest-calculator.service';

const STORAGE_KEY = 'interestCalcState';

interface InterestModel {
  capital: number;
  rate: number;
  startDate: string;
  endDate: string;
}

import { DecimalPipe } from '@angular/common';
import { EuroPipe } from '../../pipes/euro.pipe';
import { CalcExplanationComponent } from '../calc-explanation/calc-explanation.component';
import { ExportRowComponent } from '../export-row/export-row.component';
import { LawFooterComponent } from '../law-footer/law-footer.component';
@Component({
  selector: 'app-interest-calculator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, FormField, EuroPipe, CalcExplanationComponent, ExportRowComponent, LawFooterComponent],
  templateUrl: './interest-calculator.component.html',
  styleUrl: './interest-calculator.component.scss',
})
export class InterestCalculatorComponent {
  formModel = signal<InterestModel>(this.createDefaultModel());
  formFields = form(this.formModel);

  private readonly destroyRef = inject(DestroyRef);
  private readonly calc = inject(InterestCalculatorService);
  private readonly persistence = inject(CalculatorPersistenceService);

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

  readonly explanationSteps = [
    'Οι τόκοι υπολογίζονται ημερησίως: κεφάλαιο × (επιτόκιο ÷ 365) × ημέρες.',
    'Ο φόρος τόκων παρακρατείται στην πηγή με συντελεστή 15%.',
    'Οι καθαροί τόκοι = μικτοί τόκοι − παρακρατούμενος φόρος.',
    'Το τελικό ποσό = αρχικό κεφάλαιο + καθαροί τόκοι.',
  ];

  readonly explanationFormula =
    'Μικτοί τόκοι = Κεφάλαιο × (Επιτόκιο / 365) × Ημέρες · Καθαροί = Μικτοί × 85%';

  constructor() {
    this.persistence.initSignalForm(this.formModel, STORAGE_KEY, this.destroyRef, {
      onAfterInit: () => this.detectActiveDuration(),
    });

    effect(() => {
      this.formModel();
      this.detectActiveDuration();
    });
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
    const wholeMonths = Math.floor(totalMonths);
    const fractionalDays = Math.round((totalMonths - wholeMonths) * 30.44);
    const start = new Date(this.formModel().startDate);
    if (isNaN(start.getTime())) return;
    const end = new Date(start);
    end.setMonth(end.getMonth() + wholeMonths);
    end.setDate(end.getDate() + fractionalDays);
    this.formModel.update(m => ({ ...m, endDate: this.formatDate(end) }));
    this.detectActiveDuration();
  }

  private applyMonths(months: number): void {
    const start = new Date(this.formModel().startDate);
    if (isNaN(start.getTime())) return;
    const end = new Date(start);
    end.setMonth(end.getMonth() + months);
    this.formModel.update(m => ({ ...m, endDate: this.formatDate(end) }));
  }

  private detectActiveDuration(): void {
    const { startDate, endDate } = this.formModel();
    const start = new Date(startDate);
    const end = new Date(endDate);
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

  endDateFormatted = computed(() => {
    const val = this.formModel().endDate;
    if (!val) return '';
    const [y, m, d] = val.split('-');
    return `${d}/${m}/${y}`;
  });

  result = computed<InterestResult>(() => this.calc.calculate(this.formModel()));

  shareSummary = computed(() => {
    const r = this.result();
    return `Τόκοι Salaries.gr: καθαροί ${r.netInterest.toFixed(2)}€, τελικό ποσό ${r.totalAmount.toFixed(2)}€ (${r.days} ημέρες)`;
  });

  private createDefaultModel(): InterestModel {
    const today = new Date();
    const oneYearLater = new Date(today);
    oneYearLater.setFullYear(today.getFullYear() + 1);
    return {
      capital: 10000,
      rate: 3.5,
      startDate: this.formatDate(today),
      endDate: this.formatDate(oneYearLater),
    };
  }

  private formatDate(d: Date): string {
    return d.toISOString().split('T')[0];
  }
}
