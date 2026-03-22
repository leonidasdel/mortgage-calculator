import { Component, computed, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { SalaryCalculatorService } from '../../services/salary-calculator.service';
import { SalaryChange, SalaryParams } from '../../models/salary.models';

const STORAGE_KEY = 'salaryCalcState';

@Component({
  selector: 'app-salary-calculator',
  standalone: false,
  templateUrl: './salary-calculator.component.html',
  styleUrl: './salary-calculator.component.scss',
})
export class SalaryCalculatorComponent implements OnInit {
  salaryForm: FormGroup;
  annualBonus = signal(0);
  inputMode = signal<'gross' | 'net'>('gross');
  showTaxDetails = signal(false);
  hasSalaryChange = signal(false);
  salaryChangeMonth = signal(4);
  previousGross = signal(0);

  private formValues;

  constructor(
    private fb: FormBuilder,
    private calc: SalaryCalculatorService,
  ) {
    this.salaryForm = this.fb.group({
      grossMonthly: [1500],
      netMonthly: [0],
      year: [2026],
      ageGroup: ['over30'],
      children: [0],
    });

    this.formValues = toSignal(this.salaryForm.valueChanges, { initialValue: this.salaryForm.value });
  }

  ngOnInit(): void {
    this.loadState();
    // Compute initial net
    this.syncFromGross();
    this.salaryForm.valueChanges.subscribe(() => this.saveState());
  }

  raiseDiff = computed(() => {
    const r = this.result();
    if (!r.previousMonthly || !r.currentMonthly) return null;
    const monthly = +(r.currentMonthly.netMonthly - r.previousMonthly.netMonthly).toFixed(2);
    const annual = +(monthly * 14).toFixed(2);
    return { monthly, annual };
  });

  result = computed(() => {
    this.formValues();
    const fv = this.salaryForm.value;
    const salaryChange: SalaryChange | undefined = this.hasSalaryChange()
      ? { effectiveMonth: this.salaryChangeMonth(), previousGross: this.previousGross() }
      : undefined;
    const params: SalaryParams = {
      grossMonthly: fv.grossMonthly || 0,
      year: fv.year || 2026,
      ageGroup: fv.ageGroup || 'over30',
      children: fv.children || 0,
      annualBonus: this.annualBonus(),
      salaryChange,
    };
    return this.calc.calculate(params);
  });

  onGrossChange(): void {
    this.inputMode.set('gross');
    this.syncFromGross();
  }

  onNetChange(): void {
    this.inputMode.set('net');
    const netTarget = this.salaryForm.get('netMonthly')?.value || 0;
    const fv = this.salaryForm.value;
    const salaryChange: SalaryChange | undefined = this.hasSalaryChange()
      ? { effectiveMonth: this.salaryChangeMonth(), previousGross: this.previousGross() }
      : undefined;
    const gross = this.calc.reverseCalculate(netTarget, {
      year: fv.year || 2026,
      ageGroup: fv.ageGroup || 'over30',
      children: fv.children || 0,
      annualBonus: this.annualBonus(),
      salaryChange,
    });
    this.salaryForm.patchValue({ grossMonthly: gross }, { emitEvent: false });
    // Trigger recompute
    this.salaryForm.updateValueAndValidity();
  }

  onParamChange(): void {
    if (this.inputMode() === 'net') {
      this.onNetChange();
    } else {
      this.syncFromGross();
    }
  }

  private syncFromGross(): void {
    const r = this.result();
    const net = r.currentMonthly ? r.currentMonthly.netMonthly : r.netMonthly;
    this.salaryForm.patchValue({ netMonthly: net }, { emitEvent: false });
  }

  onAnnualBonusChange(value: string): void {
    this.annualBonus.set(Math.max(0, parseFloat(value) || 0));
    this.onParamChange();
    this.saveState();
  }

  toggleTaxDetails(): void {
    this.showTaxDetails.set(!this.showTaxDetails());
  }

  toggleSalaryChange(): void {
    this.hasSalaryChange.set(!this.hasSalaryChange());
    this.onParamChange();
    this.saveState();
  }

  onSalaryChangeMonthChange(value: string): void {
    this.salaryChangeMonth.set(parseInt(value, 10) || 4);
    this.onParamChange();
    this.saveState();
  }

  onPreviousGrossChange(value: string): void {
    this.previousGross.set(Math.max(0, parseFloat(value) || 0));
    this.onParamChange();
    this.saveState();
  }

  get ageGroupLabel(): string {
    const ag = this.salaryForm.get('ageGroup')?.value;
    switch (ag) {
      case 'under25': return 'Έως 25 ετών';
      case '26to30': return '26-30 ετών';
      default: return 'Άνω των 30';
    }
  }

  private saveState(): void {
    try {
      const state = {
        inputs: this.salaryForm.value,
        annualBonus: this.annualBonus(),
        inputMode: this.inputMode(),
        hasSalaryChange: this.hasSalaryChange(),
        salaryChangeMonth: this.salaryChangeMonth(),
        previousGross: this.previousGross(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch { /* storage unavailable */ }
  }

  private loadState(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const state = JSON.parse(raw);
      if (state.inputs) this.salaryForm.patchValue(state.inputs, { emitEvent: false });
      if (state.annualBonus != null) this.annualBonus.set(state.annualBonus);
      if (state.inputMode) this.inputMode.set(state.inputMode);
      if (state.hasSalaryChange != null) this.hasSalaryChange.set(state.hasSalaryChange);
      if (state.salaryChangeMonth != null) this.salaryChangeMonth.set(state.salaryChangeMonth);
      if (state.previousGross != null) this.previousGross.set(state.previousGross);
    } catch { /* ignore */ }
  }
}
