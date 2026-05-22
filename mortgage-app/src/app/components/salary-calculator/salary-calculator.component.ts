import { Component, computed, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { SalaryCalculatorService } from '../../services/salary-calculator.service';
import { ExportService } from '../../services/export.service';
import { CalculatorPersistenceService } from '../../services/calculator-persistence.service';
import { SalaryChange, PayslipLine } from '../../models/salary.models';

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
  hasMultiEmployer = signal(false);
  salaryChangeMonth = signal(4);
  previousGross = signal(0);

  private formValues;
  private destroyRef = inject(DestroyRef);

  constructor(
    private fb: FormBuilder,
    private calc: SalaryCalculatorService,
    private exportSvc: ExportService,
    private persistence: CalculatorPersistenceService,
  ) {
    this.salaryForm = this.fb.group({
      grossMonthly: [1500],
      netMonthly: [0],
      year: [2026],
      ageGroup: ['over30'],
      children: [0],
      hasSalaryChange: [false],
      salaryChangeMonth: [4],
      previousGross: [0],
      ftePercent: [100],
      employer2Gross: [0],
      employer3Gross: [0],
    });

    this.formValues = toSignal(this.salaryForm.valueChanges, { initialValue: this.salaryForm.value });
  }

  ngOnInit(): void {
    this.persistence.initCalculatorForm(this.salaryForm, STORAGE_KEY, this.destroyRef, {
      onLoad: (saved) => this.applySavedState(saved),
      onSave: () => this.saveState(),
      onApplyShareState: (state, form) => {
        if (state['annualBonus'] != null) this.annualBonus.set(Number(state['annualBonus']));
        delete state['annualBonus'];
        form.patchValue(state, { emitEvent: false });
        this.syncFromGross();
      },
      onAfterInit: () => this.syncFromGross(),
    });
  }

  private buildParams() {
    return this.calc.buildSalaryParams(this.salaryForm.value, { annualBonus: this.annualBonus() });
  }

  raiseDiff = computed(() => {
    this.formValues();
    const r = this.result();
    if (!r.previousMonthly || !r.currentMonthly) return null;
    const monthly = +(r.currentMonthly.netMonthly - r.previousMonthly.netMonthly).toFixed(2);
    const annual = +(monthly * 14).toFixed(2);
    return { monthly, annual };
  });

  result = computed(() => {
    this.formValues();
    return this.calc.calculate(this.buildParams());
  });

  fullTimeResult = computed(() => {
    this.formValues();
    const fv = this.salaryForm.value;
    const fte = Number(fv.ftePercent) || 100;
    if (fte >= 100) return null;
    return this.calc.calculate({ ...this.buildParams(), ftePercent: 100 });
  });

  multiEmployerResult = computed(() => {
    if (!this.hasMultiEmployer()) return null;
    this.formValues();
    const fv = this.salaryForm.value;
    const grosses = [fv.grossMonthly, fv.employer2Gross, fv.employer3Gross]
      .map((g: unknown) => Math.max(0, Number(g) || 0))
      .filter((g: number) => g > 0);
    if (grosses.length < 2) return null;
    return this.calc.calculateMultiEmployer({
      grossEmployers: grosses,
      year: fv.year || 2026,
      ageGroup: fv.ageGroup || 'over30',
      children: fv.children || 0,
    });
  });

  shareState = computed(() => {
    this.formValues();
    return { ...this.salaryForm.value, annualBonus: this.annualBonus() };
  });

  shareSummary = computed(() => {
    this.formValues();
    const r = this.result();
    return `Καθαρά μισθός: €${r.netMonthly.toFixed(2)}/μήνα (${this.salaryForm.value.year})`;
  });

  onGrossChange(): void {
    this.inputMode.set('gross');
    this.syncFromGross();
  }

  onNetChange(): void {
    this.inputMode.set('net');
    const netTarget = this.salaryForm.get('netMonthly')?.value || 0;
    const fv = this.salaryForm.value;
    const salaryChangeMonth = Math.min(12, Math.max(1, Number(fv.salaryChangeMonth) || this.salaryChangeMonth()));
    const previousGross = Math.max(0, Number(fv.previousGross) || this.previousGross());
    const hasSalaryChange = !!fv.hasSalaryChange;
    const salaryChange: SalaryChange | undefined = hasSalaryChange
      ? { effectiveMonth: salaryChangeMonth, previousGross }
      : undefined;
    const gross = this.calc.reverseCalculate(netTarget, {
      year: fv.year || 2026,
      ageGroup: fv.ageGroup || 'over30',
      children: fv.children || 0,
      annualBonus: this.annualBonus(),
      salaryChange,
      ftePercent: Number(fv.ftePercent) || 100,
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

  toggleSalaryChange(checked?: boolean): void {
    const next = checked ?? !this.hasSalaryChange();
    this.hasSalaryChange.set(next);
    this.salaryForm.patchValue({ hasSalaryChange: next }, { emitEvent: false });
    this.onParamChange();
    this.saveState();
  }

  toggleMultiEmployer(checked?: boolean): void {
    const next = checked ?? !this.hasMultiEmployer();
    this.hasMultiEmployer.set(next);
    this.saveState();
  }

  exportPayslip(): void {
    const r = this.result();
    const lines: PayslipLine[] = [
      { label: 'Μικτά μηνιαία', value: `€${r.grossMonthly.toFixed(2)}` },
      { label: 'ΕΦΚΑ εργαζόμενου', value: `€${r.efkaEmployee.toFixed(2)}` },
      { label: 'Φόρος εισοδήματος', value: `€${r.incomeTax.toFixed(2)}` },
      { label: 'Καθαρά μηνιαία', value: `€${r.netMonthly.toFixed(2)}` },
      { label: 'Δώρο Χριστουγέννων (καθαρά)', value: `€${r.christmasBonus.net.toFixed(2)}` },
      { label: 'Δώρο Πάσχα (καθαρά)', value: `€${r.easterBonus.net.toFixed(2)}` },
      { label: 'Επίδομα αδείας (καθαρά)', value: `€${r.leaveAllowance.net.toFixed(2)}` },
      { label: 'ΕΦΚΑ εργοδότη', value: `€${r.efkaEmployer.toFixed(2)}` },
      { label: 'Συνολικό κόστος εργοδότη/μήνα', value: `€${r.employerMonthly.toFixed(2)}` },
    ];
    this.exportSvc.exportPayslipPdf(lines, 'Δελτίο Αποδοχών');
  }

  print(): void {
    this.exportSvc.printPage();
  }

  onSalaryChangeMonthChange(value: string): void {
    const month = Math.min(12, Math.max(1, parseInt(value, 10) || 4));
    this.salaryChangeMonth.set(month);
    this.salaryForm.patchValue({ salaryChangeMonth: month }, { emitEvent: false });
    this.onParamChange();
    this.saveState();
  }

  onPreviousGrossChange(value: string): void {
    const previousGross = Math.max(0, parseFloat(value) || 0);
    this.previousGross.set(previousGross);
    this.salaryForm.patchValue({ previousGross }, { emitEvent: false });
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
      const fv = this.salaryForm.value;
      const state = {
        inputs: fv,
        annualBonus: this.annualBonus(),
        inputMode: this.inputMode(),
        hasSalaryChange: !!fv.hasSalaryChange,
        hasMultiEmployer: this.hasMultiEmployer(),
        salaryChangeMonth: Math.min(12, Math.max(1, Number(fv.salaryChangeMonth) || 4)),
        previousGross: Math.max(0, Number(fv.previousGross) || 0),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch { /* storage unavailable */ }
  }

  private applySavedState(state: Record<string, unknown>): void {
    const inputs = state['inputs'] as Record<string, unknown> | undefined;
    if (inputs) this.salaryForm.patchValue(inputs, { emitEvent: false });
    if (state['annualBonus'] != null) this.annualBonus.set(Number(state['annualBonus']));
    if (state['hasMultiEmployer'] != null) this.hasMultiEmployer.set(!!state['hasMultiEmployer']);
    if (state['inputMode']) this.inputMode.set(state['inputMode'] as 'gross' | 'net');
    const hasSalaryChange = inputs?.['hasSalaryChange'] ?? state['hasSalaryChange'];
    const salaryChangeMonth = inputs?.['salaryChangeMonth'] ?? state['salaryChangeMonth'];
    const previousGross = inputs?.['previousGross'] ?? state['previousGross'];
    if (hasSalaryChange != null) {
      this.hasSalaryChange.set(!!hasSalaryChange);
      this.salaryForm.patchValue({ hasSalaryChange: !!hasSalaryChange }, { emitEvent: false });
    }
    if (salaryChangeMonth != null) {
      const month = Math.min(12, Math.max(1, Number(salaryChangeMonth) || 4));
      this.salaryChangeMonth.set(month);
      this.salaryForm.patchValue({ salaryChangeMonth: month }, { emitEvent: false });
    }
    if (previousGross != null) {
      const gross = Math.max(0, Number(previousGross) || 0);
      this.previousGross.set(gross);
      this.salaryForm.patchValue({ previousGross: gross }, { emitEvent: false });
    }
  }
}
