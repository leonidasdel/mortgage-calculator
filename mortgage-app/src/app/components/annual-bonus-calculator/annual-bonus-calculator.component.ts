import { Component, computed, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { AnnualBonusResult, SalaryChange, SalaryParams } from '../../models/salary.models';
import { SalaryCalculatorService } from '../../services/salary-calculator.service';

const STORAGE_KEY = 'annualBonusCalcState';

const ZERO_BONUS: AnnualBonusResult = {
  grossBonus: 0,
  efkaEmployee: 0,
  efkaEmployer: 0,
  tax: 0,
  net: 0,
};

@Component({
  selector: 'app-annual-bonus-calculator',
  standalone: false,
  templateUrl: './annual-bonus-calculator.component.html',
  styleUrl: './annual-bonus-calculator.component.scss',
})
export class AnnualBonusCalculatorComponent implements OnInit {
  form: FormGroup;

  readonly months = [
    { value: 1, label: 'Ιανουάριος' },
    { value: 2, label: 'Φεβρουάριος' },
    { value: 3, label: 'Μάρτιος' },
    { value: 4, label: 'Απρίλιος' },
    { value: 5, label: 'Μάιος' },
    { value: 6, label: 'Ιούνιος' },
    { value: 7, label: 'Ιούλιος' },
    { value: 8, label: 'Αύγουστος' },
    { value: 9, label: 'Σεπτέμβριος' },
    { value: 10, label: 'Οκτώβριος' },
    { value: 11, label: 'Νοέμβριος' },
    { value: 12, label: 'Δεκέμβριος' },
  ];

  private formValues;

  constructor(
    private fb: FormBuilder,
    private calc: SalaryCalculatorService,
  ) {
    this.form = this.fb.group({
      grossMonthly: [1500],
      annualBonus: [1000],
      year: [2026],
      ageGroup: ['over30'],
      children: [0],
      hasSalaryChange: [false],
      salaryChangeMonth: [4],
      previousGross: [0],
    });

    this.formValues = toSignal(this.form.valueChanges, { initialValue: this.form.value });
  }

  ngOnInit(): void {
    this.loadState();
    this.form.valueChanges.subscribe(() => this.saveState());
  }

  result = computed(() => {
    this.formValues();
    return this.calc.calculate(this.buildParams());
  });

  bonus = computed<AnnualBonusResult>(() => this.result().bonusResult ?? ZERO_BONUS);

  totalDeductions = computed(() => {
    const bonus = this.bonus();
    return +(bonus.efkaEmployee + bonus.tax).toFixed(2);
  });

  employerBonusCost = computed(() => {
    const bonus = this.bonus();
    return +(bonus.grossBonus + bonus.efkaEmployer).toFixed(2);
  });

  takeHomeRate = computed(() => {
    const bonus = this.bonus();
    if (bonus.grossBonus <= 0) return 0;
    return +((bonus.net / bonus.grossBonus) * 100).toFixed(2);
  });

  private buildParams(): SalaryParams {
    const fv = this.form.value;
    const salaryChange: SalaryChange | undefined = fv.hasSalaryChange
      ? {
          effectiveMonth: this.clampMonth(fv.salaryChangeMonth),
          previousGross: this.toAmount(fv.previousGross),
        }
      : undefined;

    return {
      grossMonthly: this.toAmount(fv.grossMonthly),
      annualBonus: this.toAmount(fv.annualBonus),
      year: Number(fv.year) || 2026,
      ageGroup: fv.ageGroup || 'over30',
      children: Math.max(0, Number(fv.children) || 0),
      salaryChange,
    };
  }

  private toAmount(value: unknown): number {
    return Math.max(0, Number(value) || 0);
  }

  private clampMonth(value: unknown): number {
    return Math.min(12, Math.max(1, Number(value) || 4));
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
    } catch { /* ignore invalid storage */ }
  }
}
