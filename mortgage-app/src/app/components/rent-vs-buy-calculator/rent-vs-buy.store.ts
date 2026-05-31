import { computed, inject, WritableSignal } from '@angular/core';
import { signalStore, withComputed, withHooks, withState } from '@ngrx/signals';
import { CompareRow } from '../compare-panel/compare-panel.component';
import {
  RentVsBuyCalculatorService,
  RentVsBuyResult,
} from '../../services/rent-vs-buy-calculator.service';
import { withCalculatorPersistence } from '../../utils/store-adapters';

const STORAGE_KEY = 'rentVsBuyCalcState';

export interface RentVsBuyModel {
  propertyPrice: number;
  downPaymentMode: string;
  downPaymentPct: number;
  downPaymentAmount: number;
  closingCostsMode: string;
  closingCostsPct: number;
  closingCostsAmount: number;
  mortgageRate: number;
  mortgageTerm: number;
  monthlyRent: number;
  rentGrowthRate: number;
  propertyGrowthRate: number;
  investmentReturn: number;
  annualOwnershipCostPct: number;
  timeHorizon: number;
  compareTimeHorizon: number;
}

const DEFAULT_MODEL: RentVsBuyModel = {
  propertyPrice: 250000,
  downPaymentMode: 'pct',
  downPaymentPct: 20,
  downPaymentAmount: 50000,
  closingCostsMode: 'pct',
  closingCostsPct: 3,
  closingCostsAmount: 7500,
  mortgageRate: 3.5,
  mortgageTerm: 30,
  monthlyRent: 900,
  rentGrowthRate: 3,
  propertyGrowthRate: 1,
  investmentReturn: 5,
  annualOwnershipCostPct: 0.5,
  timeHorizon: 20,
  compareTimeHorizon: 10,
};

function patchRentVsBuyLoadedState(
  state: Record<string, unknown>,
  model: WritableSignal<RentVsBuyModel>,
): void {
  if (state['downPaymentMode'] == null) state['downPaymentMode'] = 'pct';
  if (state['closingCostsMode'] == null) state['closingCostsMode'] = 'pct';
  if (state['downPaymentAmount'] == null) {
    const price = Math.max(0, Number(state['propertyPrice']) || 0);
    const pct = Math.min(100, Math.max(0, Number(state['downPaymentPct']) || 0));
    state['downPaymentAmount'] = +((price * pct) / 100).toFixed(2);
  }
  if (state['closingCostsAmount'] == null) {
    const price = Math.max(0, Number(state['propertyPrice']) || 0);
    const pct = Math.max(0, Number(state['closingCostsPct']) || 0);
    state['closingCostsAmount'] = +((price * pct) / 100).toFixed(2);
  }
  model.set({ ...model(), ...state } as RentVsBuyModel);
}

export const RentVsBuyStore = signalStore(
  withState({ formModel: DEFAULT_MODEL }),
  withCalculatorPersistence<RentVsBuyModel>(STORAGE_KEY, {
    onLoad: (saved, model) => patchRentVsBuyLoadedState(saved, model),
    onApplyShareState: (state, model) => patchRentVsBuyLoadedState(state, model),
  }),
  withComputed((store, calc = inject(RentVsBuyCalculatorService)) => {
    const rentProjections = computed(() => {
      const fv = store.formModel();
      const monthly = Math.max(0, fv.monthlyRent || 0);
      const growth = fv.rentGrowthRate ?? 3;
      return [3, 5, 10].map((y) => ({
        years: y,
        rent: Math.round(monthly * Math.pow(1 + growth / 100, y)),
      }));
    });

    const result = computed<RentVsBuyResult>(() => {
      const horizon = Math.min(40, Math.max(1, Number(store.formModel().timeHorizon) || 20));
      return calc.calculate(store.formModel(), horizon);
    });

    const compareResult = computed(() => {
      const horizon = Math.min(40, Math.max(1, Number(store.formModel().compareTimeHorizon) || 10));
      return calc.calculate(store.formModel(), horizon);
    });

    const compareRows = computed((): CompareRow[] => {
      const a = result();
      const b = compareResult();
      const fmt = (n: number) => `${Math.round(n).toLocaleString('el-GR')} €`;
      const winnerLabel = (w: 'buy' | 'rent' | 'tie') =>
        w === 'buy' ? 'Αγορά' : w === 'rent' ? 'Ενοίκιο' : 'Ισοδύναμα';
      const pickWealth = (
        va: number,
        vb: number,
        winner: 'buy' | 'rent' | 'tie',
      ): 'a' | 'b' | undefined => {
        if (winner === 'buy') return va >= vb ? 'a' : 'b';
        if (winner === 'rent') return vb >= va ? 'b' : 'a';
        return undefined;
      };
      const hA = Number(store.formModel().timeHorizon) || 20;
      const hB = Number(store.formModel().compareTimeHorizon) || 10;
      return [
        { label: 'Χρονικός ορίζοντας', valueA: `${hA} έτη`, valueB: `${hB} έτη` },
        {
          label: 'Break-even έτος',
          valueA: a.breakEvenYear ? `Έτος ${a.breakEvenYear}` : '—',
          valueB: b.breakEvenYear ? `Έτος ${b.breakEvenYear}` : '—',
        },
        {
          label: 'Ίδια κεφάλαια (αγορά)',
          valueA: fmt(a.finalBuyWealth),
          valueB: fmt(b.finalBuyWealth),
          highlight: pickWealth(a.finalBuyWealth, b.finalBuyWealth, a.winner),
        },
        {
          label: 'Χαρτοφυλάκιο (ενοίκιο)',
          valueA: fmt(a.finalRentWealth),
          valueB: fmt(b.finalRentWealth),
          highlight: pickWealth(
            a.finalRentWealth,
            b.finalRentWealth,
            a.winner === 'buy' ? 'rent' : a.winner === 'rent' ? 'buy' : 'tie',
          ),
        },
        { label: 'Καλύτερη επιλογή', valueA: winnerLabel(a.winner), valueB: winnerLabel(b.winner) },
      ];
    });

    const shareSummary = computed(() => {
      const r = result();
      const w = r.winner === 'buy' ? 'Αγορά' : r.winner === 'rent' ? 'Ενοίκιο' : 'Ισοδύναμα';
      return `Νοικιάζω ή Αγοράζω Salaries.gr: ${w} συμφέρει σε ${store.formModel().timeHorizon} έτη`;
    });

    return { rentProjections, result, compareResult, compareRows, shareSummary };
  }),
  withHooks({
    onInit(store) {
      store.initCalculatorState();
    },
  }),
);
