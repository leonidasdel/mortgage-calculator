import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { CommonModule } from '@angular/common';
import { PayslipLine } from '../../models/salary.models';
import { ExportService } from '../../services/export.service';
import { SalaryChangeBlockComponent } from '../salary-change-block/salary-change-block.component';
import { SalaryPayslipPanelComponent } from '../salary-payslip-panel/salary-payslip-panel.component';
import { SalaryTaxBreakdownComponent } from '../salary-tax-breakdown/salary-tax-breakdown.component';
import { SalaryModel, SalaryStore } from './salary.store';

@Component({
  selector: 'app-salary-calculator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormField,
    SalaryChangeBlockComponent,
    SalaryPayslipPanelComponent,
    SalaryTaxBreakdownComponent,
  ],
  providers: [SalaryStore],
  templateUrl: './salary-calculator.component.html',
  styleUrl: './salary-calculator.component.scss',
})
export class SalaryCalculatorComponent {
  readonly store = inject(SalaryStore);
  private readonly exportSvc = inject(ExportService);

  readonly formFields = form<SalaryModel>(this.store.formModelWritable);
  readonly formModel = this.store.formModel;
  readonly annualBonus = this.store.annualBonus;
  readonly inputMode = this.store.inputMode;
  readonly showTaxDetails = this.store.showTaxDetails;
  readonly hasSalaryChange = this.store.hasSalaryChange;
  readonly hasMultiEmployer = this.store.hasMultiEmployer;
  readonly salaryChangeMonth = this.store.salaryChangeMonth;
  readonly previousGross = this.store.previousGross;
  readonly raiseDiff = this.store.raiseDiff;
  readonly result = this.store.result;
  readonly fullTimeResult = this.store.fullTimeResult;
  readonly multiEmployerResult = this.store.multiEmployerResult;
  readonly shareState = this.store.shareState;
  readonly shareSummary = this.store.shareSummary;
  readonly ageGroupLabel = this.store.ageGroupLabel;

  onGrossChange(event: Event): void {
    const gross = this.amountFromInput(event);
    if (gross !== null) {
      this.store.applyGrossInput(gross);
    }
  }

  onNetChange(event: Event): void {
    const net = this.amountFromInput(event);
    if (net !== null) {
      this.store.applyNetInput(net);
    }
  }

  onParamChange(): void {
    if (this.inputMode() === 'net') {
      this.store.applyNetInput(this.store.formModelWritable().netMonthly || 0);
    } else {
      this.store.syncFromGross();
    }
  }

  private amountFromInput(event: Event): number | null {
    const el = event.target;
    if (!(el instanceof HTMLInputElement)) return null;
    const value = Number(el.value);
    return Number.isFinite(value) ? Math.max(0, value) : null;
  }

  onAnnualBonusChange(value: string): void {
    this.store.setAnnualBonus(Math.max(0, parseFloat(value) || 0));
    this.onParamChange();
    this.store.saveState();
  }

  toggleTaxDetails(): void {
    this.store.toggleTaxDetails();
  }

  toggleSalaryChange(checked?: boolean): void {
    const next = checked ?? !this.hasSalaryChange();
    this.store.setHasSalaryChange(next);
    this.onParamChange();
    this.store.saveState();
  }

  toggleMultiEmployer(checked?: boolean): void {
    const next = checked ?? !this.hasMultiEmployer();
    this.store.setHasMultiEmployer(next);
    this.store.saveState();
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
    this.store.setSalaryChangeMonth(month);
    this.onParamChange();
    this.store.saveState();
  }

  onPreviousGrossChange(value: string): void {
    const prev = Math.max(0, parseFloat(value) || 0);
    this.store.setPreviousGross(prev);
    this.onParamChange();
    this.store.saveState();
  }
}
