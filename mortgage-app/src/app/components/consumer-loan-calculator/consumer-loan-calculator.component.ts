import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { form, FormField } from '@angular/forms/signals';
import { ConsumerLoanStore } from './consumer-loan.store';
import { EuroPipe } from '../../pipes/euro.pipe';
import { AmortizationChartComponent } from '../amortization-chart/amortization-chart.component';
import { AmortizationTableComponent } from '../amortization-table/amortization-table.component';
import { CalcExplanationComponent } from '../calc-explanation/calc-explanation.component';
import { ExportRowComponent } from '../export-row/export-row.component';
import { LawFooterComponent } from '../law-footer/law-footer.component';

@Component({
  selector: 'app-consumer-loan-calculator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormField,
    EuroPipe,
    AmortizationChartComponent,
    AmortizationTableComponent,
    CalcExplanationComponent,
    ExportRowComponent,
    LawFooterComponent,
  ],
  providers: [ConsumerLoanStore],
  templateUrl: './consumer-loan-calculator.component.html',
  styleUrl: './consumer-loan-calculator.component.scss',
})
export class ConsumerLoanCalculatorComponent {
  readonly store = inject(ConsumerLoanStore);
  readonly formFields = form(this.store.formModelWritable);

  // Expose signals directly to preserve HTML template references
  readonly formModel = this.store.formModel;
  readonly schedule = this.store.schedule;
  readonly summary = this.store.summary;
  readonly shareSummary = this.store.shareSummary;

  readonly quickDurations = [12, 24, 36, 48, 60, 84];

  readonly explanationSteps = [
    'Η μηνιαία δόση υπολογίζεται με τύπο PMT (ίσες δόσεις).',
    'Προστίθεται εισφορά Ν.128/1975 0,60% επί του ανεξόφλητου κεφαλαίου.',
    'Το πραγματικό επιτόκιο = ονομαστικό + 0,60% εισφορά.',
    'Το ΣΕΠΠΕ (APR) περιλαμβάνει τόκους, εισφορά και εφάπαξ έξοδα.',
  ];

  readonly explanationFormula =
    'Δόση = PMT(κεφάλαιο, ονομαστικό + 0,60%, μήνες) · Σύνολο = δόσεις + έξοδα';

  setMonths(m: number): void {
    this.store.formModelWritable.update((v) => ({ ...v, loanMonths: m }));
  }

  print(): void {
    window.print();
  }
}
