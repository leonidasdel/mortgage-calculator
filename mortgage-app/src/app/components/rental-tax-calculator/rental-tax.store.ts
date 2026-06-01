import { computed, inject, WritableSignal } from '@angular/core';
import { signalStore, withComputed, withHooks, withState } from '@ngrx/signals';
import { RentalTaxCalculatorService } from '../../services/rental-tax-calculator.service';
import { withCalculatorPersistence } from '../../utils/store-adapters';

const STORAGE_KEY = 'rentalTaxCalcState';

export interface RentalTaxModel {
  incomeMode: string;
  taxYear: string;
  annualIncome: number;
  monthlyIncome: number;
  rentalType: string;
  expenseMethod: string;
  actualExpenses: number;
}

const DEFAULT_MODEL: RentalTaxModel = {
  incomeMode: 'annual',
  taxYear: '2026',
  annualIncome: 12000,
  monthlyIncome: 1000,
  rentalType: 'long-term',
  expenseMethod: 'automatic',
  actualExpenses: 0,
};

function patchRentalTaxLoadedState(
  state: Record<string, unknown>,
  model: WritableSignal<RentalTaxModel>,
): void {
  if (state['incomeMode'] == null) state['incomeMode'] = 'annual';
  if (state['taxYear'] == null) state['taxYear'] = '2026';
  if (state['monthlyIncome'] == null) {
    state['monthlyIncome'] = +(Math.max(0, Number(state['annualIncome']) || 0) / 12).toFixed(2);
  }
  model.set({ ...model(), ...state } as RentalTaxModel);
}

export const RentalTaxStore = signalStore(
  withState({ formModel: DEFAULT_MODEL }),
  withCalculatorPersistence<RentalTaxModel>(STORAGE_KEY, {
    onLoad: (saved, model) => patchRentalTaxLoadedState(saved, model),
    onApplyShareState: (state, model) => patchRentalTaxLoadedState(state, model),
  }),
  withComputed((store, calcService = inject(RentalTaxCalculatorService)) => {
    const result = computed(() => {
      const fv = store.formModel();
      return calcService.calculate({
        incomeMode: fv.incomeMode === 'monthly' ? 'monthly' : 'annual',
        taxYear: fv.taxYear === '2025' ? 2025 : 2026,
        annualIncome: fv.annualIncome,
        monthlyIncome: fv.monthlyIncome,
        expenseMethod: fv.expenseMethod === 'actual' ? 'actual' : 'automatic',
        actualExpenses: fv.actualExpenses,
      });
    });

    const shareSummary = computed(() => {
      const r = result();
      return `Φόρος ενοικίου Salaries.gr: φόρος ${r.totalTax.toFixed(2)}€, καθαρά ${r.netAnnual.toFixed(2)}€/έτος`;
    });

    return { result, shareSummary };
  }),
  withHooks({
    onInit(store) {
      store.initCalculatorState();
    },
  }),
);
