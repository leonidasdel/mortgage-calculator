import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { DecimalPipe } from '@angular/common';
import { EuroPipe } from '../../pipes/euro.pipe';
import { CalcExplanationComponent } from '../calc-explanation/calc-explanation.component';
import { ComparePanelComponent } from '../compare-panel/compare-panel.component';
import { ExportRowComponent } from '../export-row/export-row.component';
import { LawFooterComponent } from '../law-footer/law-footer.component';
import { setupRentVsBuyLinkedFields } from './rent-vs-buy-linked-fields';
import { rentVsBuyFormSchema } from './rent-vs-buy.schema';
import { RentVsBuyStore } from './rent-vs-buy.store';

@Component({
  selector: 'app-rent-vs-buy-calculator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    FormField,
    EuroPipe,
    CalcExplanationComponent,
    ComparePanelComponent,
    ExportRowComponent,
    LawFooterComponent,
  ],
  providers: [RentVsBuyStore],
  templateUrl: './rent-vs-buy-calculator.component.html',
  styleUrl: './rent-vs-buy-calculator.component.scss',
})
export class RentVsBuyCalculatorComponent {
  readonly store = inject(RentVsBuyStore);
  private readonly destroyRef = inject(DestroyRef);

  private readonly linked = setupRentVsBuyLinkedFields(
    this.store.formModelWritable,
    this.destroyRef,
  );

  readonly formFields = form(this.store.formModelWritable, rentVsBuyFormSchema);

  readonly formModel = this.store.formModel;
  readonly rentProjections = this.store.rentProjections;
  readonly result = this.store.result;
  readonly compareResult = this.store.compareResult;
  readonly compareRows = this.store.compareRows;
  readonly shareSummary = this.store.shareSummary;

  readonly explanationSteps = [
    'Ο ενοικιαστής επενδύει την προκαταβολή και τα έξοδα αγοράς σε χαρτοφυλάκιο.',
    'Κάθε μήνα επενδύεται η διαφορά δαπανών (δόση + συντήρηση − ενοίκιο).',
    'Ο αγοραστής συσσωρεύει ίδια κεφάλαια (αξία − υπόλοιπο δανείου).',
    'Συγκρίνονται τα τελικά ποσά στο τέλος του χρονικού ορίζοντα.',
  ];

  readonly explanationFormula =
    'Πλούτος αγοράς = αξία ακινήτου − υπόλοιπο · Πλούτος ενοικίου = επενδύσεις';

  onDownPaymentModeChange(mode: 'pct' | 'amount'): void {
    this.linked.onDownPaymentModeChange(mode);
  }

  onClosingCostsModeChange(mode: 'pct' | 'amount'): void {
    this.linked.onClosingCostsModeChange(mode);
  }
}
