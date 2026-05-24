import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { form, FormField } from '@angular/forms/signals';
import { SalaryCalculatorService } from '../../services/salary-calculator.service';
import { ExportService } from '../../services/export.service';
import { CalculatorPersistenceService } from '../../services/calculator-persistence.service';
import { AgeGroup, PayslipLine, SalaryChange } from '../../models/salary.models';

const STORAGE_KEY = 'salaryCalcState';

interface SalaryModel {
  grossMonthly: number;
  netMonthly: number;
  year: string;
  ageGroup: AgeGroup;
  children: string;
  hasSalaryChange: boolean;
  salaryChangeMonth: string;
  previousGross: number;
  ftePercent: number;
  employer2Gross: number;
  employer3Gross: number;
}

import { CommonModule } from '@angular/common';
import { SalaryChangeBlockComponent } from '../salary-change-block/salary-change-block.component';
import { SalaryPayslipPanelComponent } from '../salary-payslip-panel/salary-payslip-panel.component';
import { SalaryTaxBreakdownComponent } from '../salary-tax-breakdown/salary-tax-breakdown.component';
@Component({
  selector: 'app-salary-calculator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormField, SalaryChangeBlockComponent, SalaryPayslipPanelComponent, SalaryTaxBreakdownComponent],
  templateUrl: './salary-calculator.component.html',
  styleUrl: './salary-calculator.component.scss',
})
export class SalaryCalculatorComponent {
  formModel = signal<SalaryModel>({
    grossMonthly: 1500,
    netMonthly: 0,
    year: '2026',
    ageGroup: 'over30',
    children: '0',
    hasSalaryChange: false,
    salaryChangeMonth: '4',
    previousGross: 0,
    ftePercent: 100,
    employer2Gross: 0,
    employer3Gross: 0,
  });
  formFields = form(this.formModel);

  annualBonus = signal(0);
  inputMode = signal<'gross' | 'net'>('gross');
  showTaxDetails = signal(false);
  hasSalaryChange = signal(false);
  hasMultiEmployer = signal(false);
  salaryChangeMonth = signal(4);
  previousGross = signal(0);

  private readonly destroyRef = inject(DestroyRef);
  private readonly calc = inject(SalaryCalculatorService);
  private readonly exportSvc = inject(ExportService);
  private readonly persistence = inject(CalculatorPersistenceService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  constructor() {
    this.persistence.initSignalForm(this.formModel, STORAGE_KEY, this.destroyRef, {
      onLoad: (saved) => this.applySavedState(saved),
      onSave: (value) => this.saveState(value),
      onApplyShareState: (state, model) => {
        if (state['annualBonus'] != null) this.annualBonus.set(Number(state['annualBonus']));
        delete state['annualBonus'];
        model.set({ ...model(), ...state } as SalaryModel);
        this.syncFromGross();
      },
      onAfterInit: () => this.syncFromGross(),
    });
  }

  private buildParams() {
    return this.calc.buildSalaryParams(this.formModel(), { annualBonus: this.annualBonus() });
  }

  raiseDiff = computed(() => {
    const r = this.result();
    if (!r.previousMonthly || !r.currentMonthly) return null;
    const monthly = +(r.currentMonthly.netMonthly - r.previousMonthly.netMonthly).toFixed(2);
    const annual = +(monthly * 14).toFixed(2);
    return { monthly, annual };
  });

  result = computed(() => this.calc.calculate(this.buildParams()));

  fullTimeResult = computed(() => {
    const fv = this.formModel();
    const fte = Number(fv.ftePercent) || 100;
    if (fte >= 100) return null;
    return this.calc.calculate({ ...this.buildParams(), ftePercent: 100 });
  });

  multiEmployerResult = computed(() => {
    if (!this.hasMultiEmployer()) return null;
    const fv = this.formModel();
    const grosses = [fv.grossMonthly, fv.employer2Gross, fv.employer3Gross]
      .map((g) => Math.max(0, Number(g) || 0))
      .filter((g) => g > 0);
    if (grosses.length < 2) return null;
    return this.calc.calculateMultiEmployer({
      grossEmployers: grosses,
      year: Number(fv.year) || 2026,
      ageGroup: fv.ageGroup || 'over30',
      children: Math.max(0, Number(fv.children) || 0),
    });
  });

  shareState = computed(() => ({
    ...this.formModel(),
    annualBonus: this.annualBonus(),
  }));

  shareSummary = computed(() => {
    const r = this.result();
    return `Καθαρά μισθός: €${r.netMonthly.toFixed(2)}/μήνα (${this.formModel().year})`;
  });

  onGrossChange(): void {
    this.inputMode.set('gross');
    this.syncFromGross();
  }

  onNetChange(): void {
    this.inputMode.set('net');
    const fv = this.formModel();
    const netTarget = fv.netMonthly || 0;
    const salaryChangeMonth = Math.min(12, Math.max(1, Number(fv.salaryChangeMonth) || Number(this.salaryChangeMonth()) || 4));
    const previousGross = Math.max(0, Number(fv.previousGross) || this.previousGross());
    const hasSalaryChange = !!fv.hasSalaryChange;
    const salaryChange: SalaryChange | undefined = hasSalaryChange
      ? { effectiveMonth: salaryChangeMonth, previousGross }
      : undefined;
    const gross = this.calc.reverseCalculate(netTarget, {
      year: Number(fv.year) || 2026,
      ageGroup: fv.ageGroup || 'over30',
      children: Math.max(0, Number(fv.children) || 0),
      annualBonus: this.annualBonus(),
      salaryChange,
      ftePercent: Number(fv.ftePercent) || 100,
    });
    this.formModel.update(m => ({ ...m, grossMonthly: gross }));
    this.syncFromGross();
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
    this.formModel.update(m => ({ ...m, netMonthly: net }));
  }

  onAnnualBonusChange(value: string): void {
    this.annualBonus.set(Math.max(0, parseFloat(value) || 0));
    this.onParamChange();
    this.saveState(this.formModel());
  }

  toggleTaxDetails(): void {
    this.showTaxDetails.set(!this.showTaxDetails());
  }

  toggleSalaryChange(checked?: boolean): void {
    const next = checked ?? !this.hasSalaryChange();
    this.hasSalaryChange.set(next);
    this.formModel.update(m => ({ ...m, hasSalaryChange: next }));
    this.onParamChange();
    this.saveState(this.formModel());
  }

  toggleMultiEmployer(checked?: boolean): void {
    const next = checked ?? !this.hasMultiEmployer();
    this.hasMultiEmployer.set(next);
    this.saveState(this.formModel());
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
    this.formModel.update(m => ({ ...m, salaryChangeMonth: String(month) }));
    this.onParamChange();
    this.saveState(this.formModel());
  }

  onPreviousGrossChange(value: string): void {
    const prev = Math.max(0, parseFloat(value) || 0);
    this.previousGross.set(prev);
    this.formModel.update(m => ({ ...m, previousGross: prev }));
    this.onParamChange();
    this.saveState(this.formModel());
  }

  ageGroupLabel = computed(() => {
    const ag = this.formModel().ageGroup;
    switch (ag) {
      case 'under25': return 'Έως 25 ετών';
      case '26to30': return '26-30 ετών';
      default: return 'Άνω των 30';
    }
  });

  private saveState(fv: SalaryModel): void {
    if (!this.isBrowser) return;
    try {
      const salaryChangeMonth = Math.min(12, Math.max(1, Number(fv.salaryChangeMonth) || 4));
      const previousGross = Math.max(0, Number(fv.previousGross) || 0);
      const state = {
        inputs: {
          ...fv,
          salaryChangeMonth,
          previousGross,
        },
        annualBonus: this.annualBonus(),
        inputMode: this.inputMode(),
        hasSalaryChange: !!fv.hasSalaryChange,
        hasMultiEmployer: this.hasMultiEmployer(),
        salaryChangeMonth,
        previousGross,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch { /* storage unavailable */ }
  }

  private applySavedState(state: Record<string, unknown>): void {
    const inputs = state['inputs'] as Record<string, unknown> | undefined;
    if (inputs) {
      this.formModel.set({ ...this.formModel(), ...inputs } as SalaryModel);
    }
    if (state['annualBonus'] != null) this.annualBonus.set(Number(state['annualBonus']));
    if (state['hasMultiEmployer'] != null) this.hasMultiEmployer.set(!!state['hasMultiEmployer']);
    if (state['inputMode']) this.inputMode.set(state['inputMode'] as 'gross' | 'net');
    const hasSalaryChange = inputs?.['hasSalaryChange'] ?? state['hasSalaryChange'];
    const salaryChangeMonth = inputs?.['salaryChangeMonth'] ?? state['salaryChangeMonth'];
    const previousGross = inputs?.['previousGross'] ?? state['previousGross'];
    if (hasSalaryChange != null) {
      this.hasSalaryChange.set(!!hasSalaryChange);
      this.formModel.update(m => ({ ...m, hasSalaryChange: !!hasSalaryChange }));
    }
    if (salaryChangeMonth != null) {
      const month = Math.min(12, Math.max(1, Number(salaryChangeMonth) || 4));
      this.salaryChangeMonth.set(month);
      this.formModel.update(m => ({ ...m, salaryChangeMonth: String(month) }));
    }
    if (previousGross != null) {
      const gross = Math.max(0, Number(previousGross) || 0);
      this.previousGross.set(gross);
      this.formModel.update(m => ({ ...m, previousGross: gross }));
    }
  }
}
