import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { CalculatorPersistenceService } from '../../services/calculator-persistence.service';
import {
  SeveranceCalculatorService,
  SeveranceResult,
} from '../../services/severance-calculator.service';

const STORAGE_KEY = 'severanceCalcState';

import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { EuroPipe } from '../../pipes/euro.pipe';
import { CalcExplanationComponent } from '../calc-explanation/calc-explanation.component';
import { ExportRowComponent } from '../export-row/export-row.component';
import { LawFooterComponent } from '../law-footer/law-footer.component';
@Component({
  selector: 'app-severance-calculator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, EuroPipe, CalcExplanationComponent, ExportRowComponent, LawFooterComponent],
  templateUrl: './severance-calculator.component.html',
  styleUrl: './severance-calculator.component.scss',
})
export class SeveranceCalculatorComponent implements OnInit {
  form: FormGroup;
  private formValues;
  private destroyRef = inject(DestroyRef);

  readonly explanationSteps = [
    'Οι μήνες αποζημίωσης καθορίζονται από τον πίνακα Ν.4808/2021.',
    'Μισθός υπολογισμού = μηνιαίος × 14 ÷ 12 (προσαύξηση 1/6).',
    'Με προειδοποίηση ή συναινετική λύση: αποζημίωση = ½.',
    'Φόρος αυτοτελώς: 0% έως €60.000, 10% / 20% / 30% πάνω.',
  ];

  readonly explanationFormula =
    'Αποζημίωση = μήνες × (μικτός × 14/12) · Καθαρά = μεικτή − φόρος';

  constructor(
    private fb: FormBuilder,
    private calc: SeveranceCalculatorService,
    private persistence: CalculatorPersistenceService,
  ) {
    this.form = this.fb.group({
      grossMonthly:    [1500],
      yearsOfService:  [5],
      monthsExtra:     [0],
      terminationType: ['without_notice'],
    });
    this.formValues = toSignal(this.form.valueChanges, { initialValue: this.form.value });
  }

  ngOnInit(): void {
    this.persistence.initCalculatorForm(this.form, STORAGE_KEY, this.destroyRef);
  }

  result = computed<SeveranceResult>(() => {
    this.formValues();
    return this.calc.calculate(this.form.value);
  });

  shareSummary = computed(() => {
    const r = this.result();
    return `Αποζημίωση Salaries.gr: καθαρά ${r.netSeverance.toFixed(2)}€ (${r.actualMonths} μισθοί, ${r.completedYears} έτη)`;
  });

  print(): void {
    window.print();
  }
}
