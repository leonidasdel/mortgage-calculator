import { Component, computed, DestroyRef, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { CalculatorPersistenceService } from '../../services/calculator-persistence.service';

const STORAGE_KEY = 'rentalTaxCalcState';

const RENTAL_TAX_BRACKETS: { from: number; to: number | null; rate: number }[] = [
  { from: 0,     to: 12000, rate: 0.15 },
  { from: 12000, to: 35000, rate: 0.35 },
  { from: 35000, to: null,  rate: 0.45 },
];

interface TaxBracketRow {
  from: number;
  to: number | null;
  rate: number;
  taxableAmount: number;
  tax: number;
}

interface RentalTaxResult {
  annualIncome: number;
  expensesDeduction: number;
  taxableIncome: number;
  bracketRows: TaxBracketRow[];
  totalTax: number;
  effectiveRate: number;
  netAnnual: number;
  netMonthly: number;
}

@Component({
  selector: 'app-rental-tax-calculator',
  standalone: false,
  templateUrl: './rental-tax-calculator.component.html',
  styleUrl: './rental-tax-calculator.component.scss',
})
export class RentalTaxCalculatorComponent implements OnInit {
  form: FormGroup;
  private formValues;
  private destroyRef = inject(DestroyRef);

  readonly explanationSteps = [
    'Το ακαθάριστο εισόδημα από ενοίκια φορολογείται αυτοτελώς.',
    'Αφαιρείται έκπτωση 5% (αυτόματη) ή πραγματικά έξοδα.',
    'Ο φόρος υπολογίζεται με κλίμακα 15% / 35% / 45%.',
    'Το καθαρό εισόδημα = ακαθάριστο − φόρος.',
  ];

  readonly explanationFormula =
    'Φόρος = κλιμακωτός(ακαθάριστο − έκπτωση) · Καθαρό = ακαθάριστο − φόρος';

  constructor(
    private fb: FormBuilder,
    private persistence: CalculatorPersistenceService,
  ) {
    this.form = this.fb.group({
      incomeMode:     ['annual'],
      annualIncome:   [12000],
      monthlyIncome:  [1000],
      rentalType:     ['long-term'],
      expenseMethod:  ['automatic'],
      actualExpenses: [0],
    });
    this.formValues = toSignal(this.form.valueChanges, { initialValue: this.form.value });
  }

  ngOnInit(): void {
    this.persistence.initCalculatorForm(this.form, STORAGE_KEY, this.destroyRef, {
      onLoad: (state) => this.patchLoadedState(state),
      onApplyShareState: (state) => this.patchLoadedState(state),
    });
  }

  result = computed<RentalTaxResult>(() => {
    this.formValues();
    const fv = this.form.value;
    const incomeMode = fv.incomeMode === 'monthly' ? 'monthly' : 'annual';
    const annualIncome = incomeMode === 'monthly'
      ? +(Math.max(0, fv.monthlyIncome || 0) * 12).toFixed(2)
      : Math.max(0, fv.annualIncome || 0);

    const expensesDeduction = fv.expenseMethod === 'automatic'
      ? annualIncome * 0.05
      : Math.max(0, Math.min(fv.actualExpenses || 0, annualIncome));

    const taxableIncome = Math.max(0, annualIncome - expensesDeduction);

    const bracketRows: TaxBracketRow[] = [];
    let remaining = taxableIncome;
    let totalTax = 0;

    for (const b of RENTAL_TAX_BRACKETS) {
      const width = b.to !== null ? b.to - b.from : Infinity;
      const taxable = Math.min(Math.max(0, remaining), width);
      if (taxable > 0) {
        const tax = taxable * b.rate;
        totalTax += tax;
        bracketRows.push({ from: b.from, to: b.to, rate: b.rate, taxableAmount: taxable, tax });
      }
      remaining -= width;
      if (remaining <= 0) break;
    }

    const effectiveRate = taxableIncome > 0 ? (totalTax / taxableIncome) * 100 : 0;
    const netAnnual = annualIncome - totalTax;
    const netMonthly = netAnnual / 12;

    return { annualIncome, expensesDeduction, taxableIncome, bracketRows, totalTax, effectiveRate, netAnnual, netMonthly };
  });

  shareSummary = computed(() => {
    const r = this.result();
    return `Φόρος ενοικίου Salaries.gr: φόρος ${r.totalTax.toFixed(2)}€, καθαρά ${r.netAnnual.toFixed(2)}€/έτος`;
  });

  print(): void {
    window.print();
  }

  onIncomeModeChange(mode: 'annual' | 'monthly'): void {
    this.form.patchValue({ incomeMode: mode });
  }

  onAnnualIncomeInput(): void {
    const annualIncome = Math.max(0, Number(this.form.get('annualIncome')?.value) || 0);
    this.form.patchValue({ monthlyIncome: +(annualIncome / 12).toFixed(2) }, { emitEvent: false });
    this.persistence.saveFormState(STORAGE_KEY, this.form.value);
  }

  onMonthlyIncomeInput(): void {
    const monthlyIncome = Math.max(0, Number(this.form.get('monthlyIncome')?.value) || 0);
    this.form.patchValue({ annualIncome: +(monthlyIncome * 12).toFixed(2) }, { emitEvent: false });
    this.persistence.saveFormState(STORAGE_KEY, this.form.value);
  }

  private patchLoadedState(state: Record<string, unknown>): void {
    if (state['incomeMode'] == null) state['incomeMode'] = 'annual';
    if (state['monthlyIncome'] == null) {
      state['monthlyIncome'] = +(Math.max(0, Number(state['annualIncome']) || 0) / 12).toFixed(2);
    }
    this.form.patchValue(state, { emitEvent: false });
  }
}
