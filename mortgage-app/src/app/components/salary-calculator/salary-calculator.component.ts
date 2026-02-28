import { Component, computed, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { SalaryCalculatorService } from '../../services/salary-calculator.service';
import { AgeGroup, BenefitInKind, SalaryParams } from '../../models/salary.models';

const STORAGE_KEY = 'salaryCalcState';

@Component({
  selector: 'app-salary-calculator',
  standalone: false,
  templateUrl: './salary-calculator.component.html',
  styleUrl: './salary-calculator.component.scss',
})
export class SalaryCalculatorComponent implements OnInit {
  salaryForm: FormGroup;
  benefits = signal<BenefitInKind[]>([]);
  inputMode = signal<'gross' | 'net'>('gross');
  showTaxDetails = signal(false);

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

  result = computed(() => {
    this.formValues();
    const fv = this.salaryForm.value;
    const params: SalaryParams = {
      grossMonthly: fv.grossMonthly || 0,
      year: fv.year || 2026,
      ageGroup: fv.ageGroup || 'over30',
      children: fv.children || 0,
      benefitsInKind: this.benefits(),
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
    const gross = this.calc.reverseCalculate(netTarget, {
      year: fv.year || 2026,
      ageGroup: fv.ageGroup || 'over30',
      children: fv.children || 0,
      benefitsInKind: this.benefits(),
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
    this.salaryForm.patchValue({ netMonthly: r.netMonthly }, { emitEvent: false });
  }

  // Benefits management
  addBenefit(): void {
    const list = this.benefits();
    const nextId = list.length > 0 ? Math.max(...list.map(b => b.id)) + 1 : 1;
    this.benefits.set([...list, { id: nextId, description: '', monthlyValue: 0 }]);
  }

  removeBenefit(id: number): void {
    this.benefits.set(this.benefits().filter(b => b.id !== id));
  }

  updateBenefit(id: number, field: 'description' | 'monthlyValue', value: string): void {
    this.benefits.set(this.benefits().map(b => {
      if (b.id !== id) return b;
      if (field === 'monthlyValue') {
        return { ...b, monthlyValue: Math.max(0, parseFloat(value) || 0) };
      }
      return { ...b, description: value };
    }));
  }

  toggleTaxDetails(): void {
    this.showTaxDetails.set(!this.showTaxDetails());
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
        benefits: this.benefits(),
        inputMode: this.inputMode(),
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
      if (Array.isArray(state.benefits)) this.benefits.set(state.benefits);
      if (state.inputMode) this.inputMode.set(state.inputMode);
    } catch { /* ignore */ }
  }
}
