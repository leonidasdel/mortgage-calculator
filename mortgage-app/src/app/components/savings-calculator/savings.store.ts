import { computed, inject } from '@angular/core';
import { signalStore, withComputed, withHooks, withState } from '@ngrx/signals';
import { CompareRow } from '../compare-panel/compare-panel.component';
import { SavingsCalculatorService, SavingsResult } from '../../services/savings-calculator.service';
import { withCalculatorPersistence } from '../../utils/store-adapters';

const STORAGE_KEY = 'savingsCalcState';

export interface SavingsModel {
  initialDeposit: number;
  monthlyContribution: number;
  compareMonthlyContribution: number;
  annualReturn: number;
  durationYears: number;
  applyTax: boolean;
  taxRate: number;
  applyInflation: boolean;
  inflationRate: number;
}

const DEFAULT_MODEL: SavingsModel = {
  initialDeposit: 10000,
  monthlyContribution: 200,
  compareMonthlyContribution: 400,
  annualReturn: 7,
  durationYears: 20,
  applyTax: true,
  taxRate: 15,
  applyInflation: false,
  inflationRate: 2,
};

export const SavingsStore = signalStore(
  withState({ formModel: DEFAULT_MODEL }),
  withCalculatorPersistence<SavingsModel>(STORAGE_KEY),
  withComputed((store, calc = inject(SavingsCalculatorService)) => {
    const result = computed<SavingsResult>(() => calc.calculate(store.formModel()));

    const compareResult = computed(() => {
      const fv = store.formModel();
      const monthly = Math.max(0, fv.compareMonthlyContribution || 0);
      return calc.calculate(fv, monthly);
    });

    const compareRows = computed((): CompareRow[] => {
      const a = result();
      const b = compareResult();
      const fmt = (n: number) => `${Math.round(n).toLocaleString('el-GR')} €`;
      const pick = (va: number, vb: number): 'a' | 'b' | undefined =>
        va > vb ? 'a' : vb > va ? 'b' : undefined;
      const monthlyA = Math.max(0, store.formModel().monthlyContribution || 0);
      const monthlyB = Math.max(0, store.formModel().compareMonthlyContribution || 0);
      return [
        { label: 'Μηνιαία εισφορά', valueA: fmt(monthlyA), valueB: fmt(monthlyB) },
        {
          label: 'Συνολικές εισφορές',
          valueA: fmt(a.totalContributed),
          valueB: fmt(b.totalContributed),
        },
        {
          label: 'Καθαρά κέρδη',
          valueA: fmt(a.netGains),
          valueB: fmt(b.netGains),
          highlight: pick(a.netGains, b.netGains),
        },
        {
          label: 'Τελικό ποσό',
          valueA: fmt(a.finalNominal),
          valueB: fmt(b.finalNominal),
          highlight: pick(a.finalNominal, b.finalNominal),
        },
      ];
    });

    const shareSummary = computed(() => {
      const r = result();
      return `Αποταμίευση Salaries.gr: τελικό ${Math.round(r.finalNominal)}€ μετά ${store.formModel().durationYears} έτη`;
    });

    return { result, compareResult, compareRows, shareSummary };
  }),
  withHooks({
    onInit(store) {
      store.initCalculatorState();
    },
  }),
);
