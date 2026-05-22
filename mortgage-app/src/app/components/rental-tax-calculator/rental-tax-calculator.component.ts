import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { form, FormField } from '@angular/forms/signals';
import { EuroPipe } from '../../pipes/euro.pipe';
import { CalcExplanationComponent } from '../calc-explanation/calc-explanation.component';
import { ExportRowComponent } from '../export-row/export-row.component';
import { LawFooterComponent } from '../law-footer/law-footer.component';
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

interface RentalTaxModel {
  incomeMode: string;
  annualIncome: number;
  monthlyIncome: number;
  rentalType: string;
  expenseMethod: string;
  actualExpenses: number;
}

@Component({
  selector: 'app-rental-tax-calculator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormField, EuroPipe, CalcExplanationComponent, ExportRowComponent, LawFooterComponent],
  templateUrl: './rental-tax-calculator.component.html',
  styleUrl: './rental-tax-calculator.component.scss',
})
export class RentalTaxCalculatorComponent {
  formModel = signal<RentalTaxModel>({
    incomeMode: 'annual',
    annualIncome: 12000,
    monthlyIncome: 1000,
    rentalType: 'long-term',
    expenseMethod: 'automatic',
    actualExpenses: 0,
  });
  formFields = form(this.formModel);

  private readonly destroyRef = inject(DestroyRef);
  private readonly persistence = inject(CalculatorPersistenceService);

  readonly explanationSteps = [
    'Το ακαθάριστο εισόδημα από ενοίκια φορολογείται αυτοτελώς.',
    'Αφαιρείται έκπτωση 5% (αυτόματη) ή πραγματικά έξοδα.',
    'Ο φόρος υπολογίζεται με κλίμακα 15% / 35% / 45%.',
    'Το καθαρό εισόδημα = ακαθάριστο − φόρος.',
  ];

  readonly explanationFormula =
    'Φόρος = κλιμακωτός(ακαθάριστο − έκπτωση) · Καθαρό = ακαθάριστο − φόρος';

  constructor() {
    this.persistence.initSignalForm(this.formModel, STORAGE_KEY, this.destroyRef, {
      onLoad: (state) => this.patchLoadedState(state),
      onApplyShareState: (state, model) => this.patchLoadedState(state, model),
    });
  }

  result = computed<RentalTaxResult>(() => {
    const fv = this.formModel();
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
    this.formModel.update(m => ({ ...m, incomeMode: mode }));
  }

  onAnnualIncomeInput(): void {
    const annualIncome = Math.max(0, Number(this.formModel().annualIncome) || 0);
    this.formModel.update(m => ({
      ...m,
      annualIncome,
      monthlyIncome: +(annualIncome / 12).toFixed(2),
    }));
  }

  onMonthlyIncomeInput(): void {
    const monthlyIncome = Math.max(0, Number(this.formModel().monthlyIncome) || 0);
    this.formModel.update(m => ({
      ...m,
      monthlyIncome,
      annualIncome: +(monthlyIncome * 12).toFixed(2),
    }));
  }

  private patchLoadedState(state: Record<string, unknown>, model = this.formModel): void {
    if (state['incomeMode'] == null) state['incomeMode'] = 'annual';
    if (state['monthlyIncome'] == null) {
      state['monthlyIncome'] = +(Math.max(0, Number(state['annualIncome']) || 0) / 12).toFixed(2);
    }
    model.set({ ...model(), ...state } as RentalTaxModel);
  }
}
