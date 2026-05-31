import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import {
  PropertyPurchaseCalculatorService,
  PropertyPurchaseResult,
} from '../../services/property-purchase-calculator.service';
import { injectCalculatorForm } from '../../utils/calculator-form.util';

const STORAGE_KEY = 'propertyPurchaseCalcState';

interface PropertyPurchaseModel {
  purchasePrice: number;
  aaotValue: number;
  isFirstHome: boolean;
  isMarried: boolean;
  children: number;
  includeAgent: boolean;
  includeLawyer: boolean;
}

import { CommonModule } from '@angular/common';
import { EuroPipe } from '../../pipes/euro.pipe';
import { CalcExplanationComponent } from '../calc-explanation/calc-explanation.component';
import { ExportRowComponent } from '../export-row/export-row.component';
import { LawFooterComponent } from '../law-footer/law-footer.component';
@Component({
  selector: 'app-property-purchase-calculator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormField,
    EuroPipe,
    CalcExplanationComponent,
    ExportRowComponent,
    LawFooterComponent,
  ],
  templateUrl: './property-purchase-calculator.component.html',
  styleUrl: './property-purchase-calculator.component.scss',
})
export class PropertyPurchaseCalculatorComponent {
  private readonly calc = inject(PropertyPurchaseCalculatorService);

  private readonly formSetup = injectCalculatorForm<PropertyPurchaseModel>({
    defaultModel: {
      purchasePrice: 200000,
      aaotValue: 200000,
      isFirstHome: true,
      isMarried: false,
      children: 0,
      includeAgent: true,
      includeLawyer: true,
    },
    storageKey: STORAGE_KEY,
  });

  readonly formModel = this.formSetup.formModel;
  readonly formFields = this.formSetup.formFields;

  readonly explanationSteps = [
    'ΦΜΑ 3% επί του μεγαλύτερου τιμήματος ή αντικειμενικής αξίας.',
    'Πρώτη κατοικία: απαλλαγή έως €200.000–€250.000 (+€25.000/τέκνο).',
    'Προστίθενται συμβολαιογραφικά (~1%+ΦΠΑ), κτηματολόγιο (0,475%).',
    'Προαιρετικά: μεσίτης (2%+ΦΠΑ) και δικηγόρος (~0,5%).',
  ];

  readonly explanationFormula = 'Σύνολο = Τίμημα + ΦΜΑ + συμβολαιογραφικά + κτηματολόγιο + λοιπά';

  result = computed<PropertyPurchaseResult>(() => this.calc.calculate(this.formModel()));

  shareSummary = computed(() => {
    const r = this.result();
    return `Αγορά ακινήτου Salaries.gr: σύνολο ${r.totalAcquisitionCost.toFixed(0)}€ (+${r.extraCostsPct}% επιπλέον δαπάνες)`;
  });

  print(): void {
    window.print();
  }
}
