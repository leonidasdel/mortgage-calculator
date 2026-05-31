import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { SalaryCalculatorService } from '../../services/salary-calculator.service';
import { HOLIDAY_BONUS_PROFILE_BINDINGS } from '../../constants/profile-field-maps';
import { injectCalculatorForm } from '../../utils/calculator-form.util';
import { AgeGroup } from '../../models/salary.models';
import { HolidayBonusModel, holidayBonusFormSchema } from './holiday-bonus.schema';

const STORAGE_KEY = 'holidayBonusCalcState';

import { CommonModule } from '@angular/common';
import { EuroPipe } from '../../pipes/euro.pipe';
import { CalcExplanationComponent } from '../calc-explanation/calc-explanation.component';
import { ExportRowComponent } from '../export-row/export-row.component';
import { LawFooterComponent } from '../law-footer/law-footer.component';

@Component({
  selector: 'app-holiday-bonus-calculator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormField,
    EuroPipe,
    CalcExplanationComponent,
    ExportRowComponent,
    LawFooterComponent,
  ],
  templateUrl: './holiday-bonus-calculator.component.html',
  styleUrl: './holiday-bonus-calculator.component.scss',
})
export class HolidayBonusCalculatorComponent {
  private readonly calc = inject(SalaryCalculatorService);

  private readonly formSetup = injectCalculatorForm<HolidayBonusModel>({
    defaultModel: {
      grossMonthly: 1500,
      year: 2026,
      ageGroup: 'over30',
      children: 0,
      partialEnabled: false,
      christmasMonthsWorked: 8,
      easterMonthsWorked: 4,
    },
    storageKey: STORAGE_KEY,
    schema: holidayBonusFormSchema,
    profileBindings: HOLIDAY_BONUS_PROFILE_BINDINGS,
  });

  readonly formModel = this.formSetup.formModel;
  readonly formFields = this.formSetup.formFields;

  readonly explanationSteps = [
    'Δώρο Χριστουγέννων = 1 μισθός (Μάι–Δεκ) + προσαύξηση 4,166%.',
    'Δώρο Πάσχα & επίδομα αδείας = ½ μισθού (Ιαν–Απρ) + 4,166%.',
    'Κάθε δώρο υπόκειται σε ΕΦΚΑ (13,37%) και φόρο εισοδήματος.',
    'Για μερική απασχόληση: αναλογία εργάσιμων μηνών.',
  ];

  readonly explanationFormula = 'Καθαρά = Σ(μικτά δώρων) − ΕΦΚΑ − φόρος (14μηνο μοντέλο)';

  result = computed(() => {
    const fv = this.formModel();
    return this.calc.calculateWithPartialBonuses({
      grossMonthly: Math.max(0, +(fv.grossMonthly || 0)),
      year: fv.year || 2026,
      ageGroup: (fv.ageGroup || 'over30') as AgeGroup,
      children: Math.max(0, +(fv.children || 0)),
      partialEnabled: !!fv.partialEnabled,
      christmasMonthsWorked: fv.christmasMonthsWorked || 0,
      easterMonthsWorked: fv.easterMonthsWorked || 0,
    });
  });

  shareSummary = computed(() => {
    const r = this.result();
    return `Δώρα Salaries.gr: καθαρά ${r.totalNet.toFixed(2)}€ (Χριστούγεννα + Πάσχα + επίδομα αδείας)`;
  });

  print(): void {
    window.print();
  }
}
