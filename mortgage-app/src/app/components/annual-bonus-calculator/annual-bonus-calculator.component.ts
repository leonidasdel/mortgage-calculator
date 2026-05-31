import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { AnnualBonusResult } from '../../models/salary.models';
import { SalaryCalculatorService } from '../../services/salary-calculator.service';
import { ANNUAL_BONUS_PROFILE_BINDINGS } from '../../constants/profile-field-maps';
import { injectCalculatorForm } from '../../utils/calculator-form.util';
import { AnnualBonusModel, annualBonusFormSchema } from './annual-bonus.schema';

const STORAGE_KEY = 'annualBonusCalcState';

const ZERO_BONUS: AnnualBonusResult = {
  grossBonus: 0,
  efkaEmployee: 0,
  efkaEmployer: 0,
  tax: 0,
  net: 0,
};

import { DecimalPipe } from '@angular/common';
import { EuroPipe } from '../../pipes/euro.pipe';
import { CalcExplanationComponent } from '../calc-explanation/calc-explanation.component';
import { ExportRowComponent } from '../export-row/export-row.component';
import { LawFooterComponent } from '../law-footer/law-footer.component';

@Component({
  selector: 'app-annual-bonus-calculator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    FormField,
    EuroPipe,
    CalcExplanationComponent,
    ExportRowComponent,
    LawFooterComponent,
  ],
  templateUrl: './annual-bonus-calculator.component.html',
  styleUrl: './annual-bonus-calculator.component.scss',
})
export class AnnualBonusCalculatorComponent {
  private readonly calc = inject(SalaryCalculatorService);

  private readonly formSetup = injectCalculatorForm<AnnualBonusModel>({
    defaultModel: {
      grossMonthly: 1500,
      annualBonus: 1000,
      year: '2026',
      ageGroup: 'over30',
      children: '0',
      hasSalaryChange: false,
      salaryChangeMonth: '4',
      previousGross: 0,
    },
    storageKey: STORAGE_KEY,
    schema: annualBonusFormSchema,
    profileBindings: ANNUAL_BONUS_PROFILE_BINDINGS,
  });

  readonly formModel = this.formSetup.formModel;
  readonly formFields = this.formSetup.formFields;

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

  readonly explanationSteps = [
    'Το μπόνους προστίθεται στο ετήσιο εισόδημα για φορολογία.',
    'Υπολογίζεται ΕΦΚΑ εργαζομένου (13,37%) στο μπόνους.',
    'Ο φόρος = οριακή διαφορά στην ετήσια φορολογητέα βάση.',
    'Καθαρό μπόνους = μικτό − ΕΦΚΑ − φόρος.',
  ];

  readonly explanationFormula = 'Καθαρό μπόνους = Μικτό − ΕΦΚΑ − οριακός φόρος';

  result = computed(() => this.calc.calculate(this.calc.buildSalaryParams(this.formModel())));

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

  shareSummary = computed(() => {
    const b = this.bonus();
    return `Ετήσιο μπόνους Salaries.gr: καθαρά ${b.net.toFixed(2)}€ από ${b.grossBonus.toFixed(2)}€ μικτά`;
  });
}
