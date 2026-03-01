import { Component, computed, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

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

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      annualIncome:   [12000],
      rentalType:     ['long-term'],
      expenseMethod:  ['automatic'],
      actualExpenses: [0],
    });
    this.formValues = toSignal(this.form.valueChanges, { initialValue: this.form.value });
  }

  ngOnInit(): void {
    this.loadState();
    this.form.valueChanges.subscribe(() => this.saveState());
  }

  result = computed<RentalTaxResult>(() => {
    this.formValues();
    const fv = this.form.value;
    const annualIncome = Math.max(0, fv.annualIncome || 0);

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

  print(): void {
    window.print();
  }

  private saveState(): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.form.value)); } catch { /* ignore */ }
  }

  private loadState(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const state = JSON.parse(raw);
      if (state) this.form.patchValue(state, { emitEvent: false });
    } catch { /* ignore */ }
  }
}
