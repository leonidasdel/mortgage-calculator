import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { CalculatorPersistenceService } from '../../services/calculator-persistence.service';
import {
  LeaveResult,
  UnusedLeaveCalculatorService,
} from '../../services/unused-leave-calculator.service';

const STORAGE_KEY = 'unusedLeaveCalcState';

interface UnusedLeaveModel {
  salaryType: 'monthly' | 'daily';
  grossMonthly: number;
  dailyWage: number;
  workWeek: '5day' | '6day';
  unusedDays: number;
  includeHolidayBonus: boolean;
  situation: 'termination' | 'during_employment';
  taxYear: '2025' | '2026';
  ageGroup: string;
  children: number;
  useCustomAnnualIncome: boolean;
  customAnnualGross: number;
}

import { CommonModule } from '@angular/common';
import { EuroPipe } from '../../pipes/euro.pipe';
import { CalcExplanationComponent } from '../calc-explanation/calc-explanation.component';
import { LawFooterComponent } from '../law-footer/law-footer.component';
import { UnusedLeaveCompensationComponent } from '../unused-leave-compensation/unused-leave-compensation.component';
import { UnusedLeaveTaxBreakdownComponent } from '../unused-leave-tax-breakdown/unused-leave-tax-breakdown.component';
@Component({
  selector: 'app-unused-leave-calculator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormField, EuroPipe, CalcExplanationComponent, LawFooterComponent, UnusedLeaveCompensationComponent, UnusedLeaveTaxBreakdownComponent],
  templateUrl: './unused-leave-calculator.component.html',
  styleUrl: './unused-leave-calculator.component.scss',
})
export class UnusedLeaveCalculatorComponent {
  formModel = signal<UnusedLeaveModel>({
    salaryType: 'monthly',
    grossMonthly: 1500,
    dailyWage: 69.23,
    workWeek: '5day',
    unusedDays: 10,
    includeHolidayBonus: true,
    situation: 'termination',
    taxYear: '2025',
    ageGroup: 'over30',
    children: 0,
    useCustomAnnualIncome: false,
    customAnnualGross: 21000,
  });
  formFields = form(this.formModel);

  private readonly destroyRef = inject(DestroyRef);
  private readonly calc = inject(UnusedLeaveCalculatorService);
  private readonly persistence = inject(CalculatorPersistenceService);

  showTaxBreakdown = false;

  readonly explanationSteps = [
    'Ημερομίσθιο = μηνιαίος ÷ 25 (πενθήμερο) ή ÷ 26 (εξαήμερο).',
    'Αποζημίωση = ημερομίσθιο × ημέρες μη ληφθείσας άδειας.',
    'Το επίδομα αδείας = 100% των αποδοχών, με ανώτατο όριο.',
    'Αφαιρούνται ΕΦΚΑ (αν ισχύει) και οριακός φόρος εισοδήματος.',
  ];

  readonly explanationFormula =
    'Καθαρά = (αποζημίωση + επίδομα) − ΕΦΚΑ − οριακός φόρος';

  constructor() {
    this.persistence.initSignalForm(this.formModel, STORAGE_KEY, this.destroyRef);
  }

  result = computed<LeaveResult>(() => this.calc.calculate(this.formModel()));

  shareSummary = computed(() => {
    const r = this.result();
    return `Μη ληφθείσα άδεια Salaries.gr: καθαρά ${r.totalNet.toFixed(2)}€ (${this.formModel().unusedDays} ημέρες)`;
  });

  patchModel(partial: Partial<UnusedLeaveModel>): void {
    this.formModel.update(m => ({ ...m, ...partial }));
  }

  toggleTaxBreakdown(): void {
    this.showTaxBreakdown = !this.showTaxBreakdown;
  }

  print(): void {
    window.print();
  }
}
