import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { form, FormField } from '@angular/forms/signals';
import { EuroPipe } from '../../pipes/euro.pipe';
import { CalcExplanationComponent } from '../calc-explanation/calc-explanation.component';
import { ExportRowComponent } from '../export-row/export-row.component';
import { LawFooterComponent } from '../law-footer/law-footer.component';
import { CalculatorPersistenceService } from '../../services/calculator-persistence.service';
import { RentalTaxCalculatorService } from '../../services/rental-tax-calculator.service';

const STORAGE_KEY = 'rentalTaxCalcState';

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
  private readonly calcService = inject(RentalTaxCalculatorService);
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

  result = computed(() => {
    const fv = this.formModel();
    return this.calcService.calculate({
      incomeMode: fv.incomeMode === 'monthly' ? 'monthly' : 'annual',
      annualIncome: fv.annualIncome,
      monthlyIncome: fv.monthlyIncome,
      expenseMethod: fv.expenseMethod === 'actual' ? 'actual' : 'automatic',
      actualExpenses: fv.actualExpenses,
    });
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
