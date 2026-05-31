import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { EuroPipe } from '../../pipes/euro.pipe';
import { CalcExplanationComponent } from '../calc-explanation/calc-explanation.component';
import { ExportRowComponent } from '../export-row/export-row.component';
import { LawFooterComponent } from '../law-footer/law-footer.component';
import {
  EFKA_CATEGORIES,
  FreelancerCalculatorService,
} from '../../services/freelancer-calculator.service';
import { FREELANCER_PROFILE_BINDINGS } from '../../constants/profile-field-maps';
import { injectCalculatorForm } from '../../utils/calculator-form.util';
import { AgeGroup } from '../../models/salary.models';
import { FreelancerModel, freelancerFormSchema } from './freelancer.schema';

const STORAGE_KEY = 'freelancerCalcState';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-freelancer-calculator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormField,
    EuroPipe,
    CalcExplanationComponent,
    ExportRowComponent,
    LawFooterComponent,
  ],
  templateUrl: './freelancer-calculator.component.html',
  styleUrl: './freelancer-calculator.component.scss',
})
export class FreelancerCalculatorComponent {
  private readonly calcService = inject(FreelancerCalculatorService);

  private readonly formSetup = injectCalculatorForm<FreelancerModel>({
    defaultModel: {
      annualRevenue: 30000,
      annualExpenses: 5000,
      efkaCategory: 'cat1',
      yearsActive: 'over3',
      ageGroup: 'over30',
      children: '0',
    },
    storageKey: STORAGE_KEY,
    schema: freelancerFormSchema,
    profileBindings: FREELANCER_PROFILE_BINDINGS,
  });

  readonly formModel = this.formSetup.formModel;
  readonly formFields = this.formSetup.formFields;

  readonly efkaCategories = EFKA_CATEGORIES;
  readonly childrenOptions = [0, 1, 2, 3, 4, 5, 6];

  readonly explanationSteps = [
    'Αφαιρούνται επαγγελματικά έξοδα και ετήσιες εισφορές ΕΦΚΑ από τα έσοδα.',
    'Ο φόρος εισοδήματος υπολογίζεται με προοδευτική κλίμακα ΚΦΕ.',
    'Προστίθεται προκαταβολή φόρου 55% (ή 27,5% τα πρώτα 3 έτη).',
    'Το καθαρό = έσοδα − έξοδα − ΕΦΚΑ − φόρος − προκαταβολή.',
  ];

  readonly explanationFormula = 'Καθαρά = Έσοδα − Έξοδα − ΕΦΚΑ − Φόρος − Προκαταβολή';

  result = computed(() => {
    const fv = this.formModel();
    return this.calcService.calculate({
      annualRevenue: fv.annualRevenue,
      annualExpenses: fv.annualExpenses,
      efkaCategory: fv.efkaCategory,
      yearsActive: fv.yearsActive,
      ageGroup: fv.ageGroup as AgeGroup,
      children: Math.min(Math.max(0, Number(fv.children) || 0), 6),
    });
  });

  shareSummary = computed(() => {
    const r = this.result();
    return `Ελεύθερος επαγγελματίας Salaries.gr: καθαρά ${r.netMonthly.toFixed(2)}€/μήνα (${r.netAnnual.toFixed(2)}€/έτος)`;
  });

  selectedEfkaMonthly = computed(() => {
    const cat = EFKA_CATEGORIES.find((c) => c.id === this.formModel().efkaCategory);
    return cat?.monthly ?? 0;
  });

  print(): void {
    window.print();
  }
}
