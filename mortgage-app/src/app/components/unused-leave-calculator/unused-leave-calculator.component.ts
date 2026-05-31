import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import {
  LeaveResult,
  UnusedLeaveCalculatorService,
} from '../../services/unused-leave-calculator.service';
import { UNUSED_LEAVE_PROFILE_BINDINGS } from '../../constants/profile-field-maps';
import { injectCalculatorForm } from '../../utils/calculator-form.util';
import { UnusedLeaveModel, unusedLeaveFormSchema } from './unused-leave.schema';

const STORAGE_KEY = 'unusedLeaveCalcState';

import { CommonModule } from '@angular/common';
import { EuroPipe } from '../../pipes/euro.pipe';
import { CalcExplanationComponent } from '../calc-explanation/calc-explanation.component';
import { LawFooterComponent } from '../law-footer/law-footer.component';
import { UnusedLeaveCompensationComponent } from '../unused-leave-compensation/unused-leave-compensation.component';
import { UnusedLeaveTaxBreakdownComponent } from '../unused-leave-tax-breakdown/unused-leave-tax-breakdown.component';

@Component({
  selector: 'app-unused-leave-calculator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormField,
    EuroPipe,
    CalcExplanationComponent,
    LawFooterComponent,
    UnusedLeaveCompensationComponent,
    UnusedLeaveTaxBreakdownComponent,
  ],
  templateUrl: './unused-leave-calculator.component.html',
  styleUrl: './unused-leave-calculator.component.scss',
})
export class UnusedLeaveCalculatorComponent {
  private readonly calc = inject(UnusedLeaveCalculatorService);

  private readonly formSetup = injectCalculatorForm<UnusedLeaveModel>({
    defaultModel: {
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
    },
    storageKey: STORAGE_KEY,
    schema: unusedLeaveFormSchema,
    profileBindings: UNUSED_LEAVE_PROFILE_BINDINGS,
  });

  readonly formModel = this.formSetup.formModel;
  readonly formFields = this.formSetup.formFields;

  showTaxBreakdown = false;

  readonly explanationSteps = [
    'Ημερομίσθιο = μηνιαίος ÷ 25 (πενθήμερο) ή ÷ 26 (εξαήμερο).',
    'Αποζημίωση = ημερομίσθιο × ημέρες μη ληφθείσας άδειας.',
    'Το επίδομα αδείας = 100% των αποδοχών, με ανώτατο όριο.',
    'Αφαιρούνται ΕΦΚΑ (αν ισχύει) και οριακός φόρος εισοδήματος.',
  ];

  readonly explanationFormula = 'Καθαρά = (αποζημίωση + επίδομα) − ΕΦΚΑ − οριακός φόρος';

  result = computed<LeaveResult>(() => this.calc.calculate(this.formModel()));

  shareSummary = computed(() => {
    const r = this.result();
    return `Μη ληφθείσα άδεια Salaries.gr: καθαρά ${r.totalNet.toFixed(2)}€ (${this.formModel().unusedDays} ημέρες)`;
  });

  patchModel(partial: Partial<UnusedLeaveModel>): void {
    this.formModel.update((m) => ({ ...m, ...partial }));
  }

  toggleTaxBreakdown(): void {
    this.showTaxBreakdown = !this.showTaxBreakdown;
  }

  print(): void {
    window.print();
  }
}
