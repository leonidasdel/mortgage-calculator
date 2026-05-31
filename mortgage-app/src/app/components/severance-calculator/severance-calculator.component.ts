import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import {
  SeveranceCalculatorService,
  SeveranceResult,
} from '../../services/severance-calculator.service';
import { SEVERANCE_PROFILE_BINDINGS } from '../../constants/profile-field-maps';
import { injectCalculatorForm } from '../../utils/calculator-form.util';
import { SeveranceModel, severanceFormSchema } from './severance.schema';

const STORAGE_KEY = 'severanceCalcState';

import { CommonModule } from '@angular/common';
import { EuroPipe } from '../../pipes/euro.pipe';
import { CalcExplanationComponent } from '../calc-explanation/calc-explanation.component';
import { ExportRowComponent } from '../export-row/export-row.component';
import { LawFooterComponent } from '../law-footer/law-footer.component';

@Component({
  selector: 'app-severance-calculator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormField,
    EuroPipe,
    CalcExplanationComponent,
    ExportRowComponent,
    LawFooterComponent,
  ],
  templateUrl: './severance-calculator.component.html',
  styleUrl: './severance-calculator.component.scss',
})
export class SeveranceCalculatorComponent {
  private readonly calc = inject(SeveranceCalculatorService);

  private readonly formSetup = injectCalculatorForm<SeveranceModel>({
    defaultModel: {
      grossMonthly: 1500,
      yearsOfService: 5,
      monthsExtra: 0,
      terminationType: 'without_notice',
    },
    storageKey: STORAGE_KEY,
    schema: severanceFormSchema,
    profileBindings: SEVERANCE_PROFILE_BINDINGS,
  });

  readonly formModel = this.formSetup.formModel;
  readonly formFields = this.formSetup.formFields;

  readonly explanationSteps = [
    'Οι μήνες αποζημίωσης καθορίζονται από τον πίνακα Ν.4808/2021.',
    'Μισθός υπολογισμού = μηνιαίος × 14 ÷ 12 (προσαύξηση 1/6).',
    'Με προειδοποίηση ή συναινετική λύση: αποζημίωση = ½.',
    'Φόρος αυτοτελώς: 0% έως €60.000, 10% / 20% / 30% πάνω.',
  ];

  readonly explanationFormula = 'Αποζημίωση = μήνες × (μικτός × 14/12) · Καθαρά = μεικτή − φόρος';

  result = computed<SeveranceResult>(() => this.calc.calculate(this.formModel()));

  shareSummary = computed(() => {
    const r = this.result();
    return `Αποζημίωση Salaries.gr: καθαρά ${r.netSeverance.toFixed(2)}€ (${r.actualMonths} μισθοί, ${r.completedYears} έτη)`;
  });

  setTerminationType(type: SeveranceModel['terminationType']): void {
    this.formModel.update((m) => ({ ...m, terminationType: type }));
  }

  print(): void {
    window.print();
  }
}
