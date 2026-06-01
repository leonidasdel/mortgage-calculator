import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { form, FormField } from '@angular/forms/signals';
import { EuroPipe } from '../../pipes/euro.pipe';
import { setupAnnualMonthlyLinks } from '../../utils/calculator-schemas';
import { CalcExplanationComponent } from '../calc-explanation/calc-explanation.component';
import { ExportRowComponent } from '../export-row/export-row.component';
import { LawFooterComponent } from '../law-footer/law-footer.component';
import { rentalTaxFormSchema } from './rental-tax.schema';
import { RentalTaxStore } from './rental-tax.store';

@Component({
  selector: 'app-rental-tax-calculator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormField,
    EuroPipe,
    CalcExplanationComponent,
    ExportRowComponent,
    LawFooterComponent,
  ],
  providers: [RentalTaxStore],
  templateUrl: './rental-tax-calculator.component.html',
  styleUrl: './rental-tax-calculator.component.scss',
})
export class RentalTaxCalculatorComponent {
  private readonly destroyRef = inject(DestroyRef);
  readonly store = inject(RentalTaxStore);

  readonly formFields = form(this.store.formModelWritable, rentalTaxFormSchema);
  readonly formModel = this.store.formModel;
  readonly result = this.store.result;
  readonly shareSummary = this.store.shareSummary;

  readonly explanationSteps = [
    'Το ακαθάριστο εισόδημα από ενοίκια φορολογείται αυτοτελώς.',
    'Αφαιρείται έκπτωση 5% (αυτόματη) ή πραγματικά έξοδα.',
    'Ο φόρος υπολογίζεται με την κλίμακα του επιλεγμένου φορολογικού έτους (2026: 15% / 25% / 35% / 45%).',
    'Το καθαρό εισόδημα = ακαθάριστο − φόρος.',
  ];

  readonly explanationFormula =
    'Φόρος = κλιμακωτός(ακαθάριστο − έκπτωση) · Καθαρό = ακαθάριστο − φόρος';

  constructor() {
    setupAnnualMonthlyLinks(
      this.store.formModelWritable,
      this.destroyRef,
      { annual: 'annualIncome', monthly: 'monthlyIncome' },
      () => this.store.formModel().incomeMode,
    );
  }

  print(): void {
    window.print();
  }

  onIncomeModeChange(mode: 'annual' | 'monthly'): void {
    this.store.formModelWritable.update((m) => ({ ...m, incomeMode: mode }));
  }
}
