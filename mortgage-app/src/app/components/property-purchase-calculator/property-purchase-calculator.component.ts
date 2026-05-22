import { Component, computed, DestroyRef, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { CalculatorPersistenceService } from '../../services/calculator-persistence.service';
import {
  PropertyPurchaseCalculatorService,
  PropertyPurchaseResult,
} from '../../services/property-purchase-calculator.service';

const STORAGE_KEY = 'propertyPurchaseCalcState';

@Component({
  selector: 'app-property-purchase-calculator',
  standalone: false,
  templateUrl: './property-purchase-calculator.component.html',
  styleUrl: './property-purchase-calculator.component.scss',
})
export class PropertyPurchaseCalculatorComponent implements OnInit {
  form: FormGroup;
  private formValues;
  private destroyRef = inject(DestroyRef);

  readonly explanationSteps = [
    'ΦΜΑ 3% επί του μεγαλύτερου τιμήματος ή αντικειμενικής αξίας.',
    'Πρώτη κατοικία: απαλλαγή έως €200.000–€250.000 (+€25.000/τέκνο).',
    'Προστίθενται συμβολαιογραφικά (~1%+ΦΠΑ), κτηματολόγιο (0,475%).',
    'Προαιρετικά: μεσίτης (2%+ΦΠΑ) και δικηγόρος (~0,5%).',
  ];

  readonly explanationFormula =
    'Σύνολο = Τίμημα + ΦΜΑ + συμβολαιογραφικά + κτηματολόγιο + λοιπά';

  constructor(
    private fb: FormBuilder,
    private calc: PropertyPurchaseCalculatorService,
    private persistence: CalculatorPersistenceService,
  ) {
    this.form = this.fb.group({
      purchasePrice: [200000],
      aaotValue:     [200000],
      isFirstHome:   [true],
      isMarried:     [false],
      children:      [0],
      includeAgent:  [true],
      includeLawyer: [true],
    });
    this.formValues = toSignal(this.form.valueChanges, { initialValue: this.form.value });
  }

  ngOnInit(): void {
    this.persistence.initCalculatorForm(this.form, STORAGE_KEY, this.destroyRef);
  }

  result = computed<PropertyPurchaseResult>(() => {
    this.formValues();
    return this.calc.calculate(this.form.value);
  });

  shareSummary = computed(() => {
    const r = this.result();
    return `Αγορά ακινήτου Salaries.gr: σύνολο ${r.totalAcquisitionCost.toFixed(0)}€ (+${r.extraCostsPct}% επιπλέον δαπάνες)`;
  });

  print(): void {
    window.print();
  }
}
