import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { CompareRow } from '../compare-panel/compare-panel.component';
import { CalculatorPersistenceService } from '../../services/calculator-persistence.service';
import {
  RentVsBuyCalculatorService,
  RentVsBuyResult,
} from '../../services/rent-vs-buy-calculator.service';

const STORAGE_KEY = 'rentVsBuyCalcState';

interface RentVsBuyModel {
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

import { DecimalPipe } from '@angular/common';
import { EuroPipe } from '../../pipes/euro.pipe';
import { CalcExplanationComponent } from '../calc-explanation/calc-explanation.component';
import { ComparePanelComponent } from '../compare-panel/compare-panel.component';
import { ExportRowComponent } from '../export-row/export-row.component';
import { LawFooterComponent } from '../law-footer/law-footer.component';
@Component({
  selector: 'app-rent-vs-buy-calculator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, FormField, EuroPipe, CalcExplanationComponent, ComparePanelComponent, ExportRowComponent, LawFooterComponent],
  templateUrl: './rent-vs-buy-calculator.component.html',
  styleUrl: './rent-vs-buy-calculator.component.scss',
})
export class RentVsBuyCalculatorComponent {
  formModel = signal<RentVsBuyModel>({
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
  });
  formFields = form(this.formModel);

  private readonly destroyRef = inject(DestroyRef);
  private readonly calc = inject(RentVsBuyCalculatorService);
  private readonly persistence = inject(CalculatorPersistenceService);

  readonly explanationSteps = [
    'Ο ενοικιαστής επενδύει την προκαταβολή και τα έξοδα αγοράς σε χαρτοφυλάκιο.',
    'Κάθε μήνα επενδύεται η διαφορά δαπανών (δόση + συντήρηση − ενοίκιο).',
    'Ο αγοραστής συσσωρεύει ίδια κεφάλαια (αξία − υπόλοιπο δανείου).',
    'Συγκρίνονται τα τελικά ποσά στο τέλος του χρονικού ορίζοντα.',
  ];

  readonly explanationFormula =
    'Πλούτος αγοράς = αξία ακινήτου − υπόλοιπο · Πλούτος ενοικίου = επενδύσεις';

  constructor() {
    this.persistence.initSignalForm(this.formModel, STORAGE_KEY, this.destroyRef, {
      onLoad: (state) => this.patchLoadedState(state),
      onApplyShareState: (state, model) => this.patchLoadedState(state, model),
    });
  }

  rentProjections = computed(() => {
    const fv = this.formModel();
    const monthly = Math.max(0, fv.monthlyRent || 0);
    const growth = fv.rentGrowthRate ?? 3;
    return [3, 5, 10].map(y => ({
      years: y,
      rent: Math.round(monthly * Math.pow(1 + growth / 100, y)),
    }));
  });

  result = computed<RentVsBuyResult>(() => {
    const horizon = Math.min(40, Math.max(1, Number(this.formModel().timeHorizon) || 20));
    return this.calc.calculate(this.formModel(), horizon);
  });

  compareResult = computed(() => {
    const horizon = Math.min(40, Math.max(1, Number(this.formModel().compareTimeHorizon) || 10));
    return this.calc.calculate(this.formModel(), horizon);
  });

  compareRows = computed((): CompareRow[] => {
    const a = this.result();
    const b = this.compareResult();
    const fmt = (n: number) => `${Math.round(n).toLocaleString('el-GR')} €`;
    const winnerLabel = (w: 'buy' | 'rent' | 'tie') =>
      w === 'buy' ? 'Αγορά' : w === 'rent' ? 'Ενοίκιο' : 'Ισοδύναμα';
    const pickWealth = (va: number, vb: number, winner: 'buy' | 'rent' | 'tie'): 'a' | 'b' | undefined => {
      if (winner === 'buy') return va >= vb ? 'a' : 'b';
      if (winner === 'rent') return vb >= va ? 'b' : 'a';
      return undefined;
    };
    const hA = Number(this.formModel().timeHorizon) || 20;
    const hB = Number(this.formModel().compareTimeHorizon) || 10;
    return [
      { label: 'Χρονικός ορίζοντας', valueA: `${hA} έτη`, valueB: `${hB} έτη` },
      { label: 'Break-even έτος', valueA: a.breakEvenYear ? `Έτος ${a.breakEvenYear}` : '—', valueB: b.breakEvenYear ? `Έτος ${b.breakEvenYear}` : '—' },
      { label: 'Ίδια κεφάλαια (αγορά)', valueA: fmt(a.finalBuyWealth), valueB: fmt(b.finalBuyWealth), highlight: pickWealth(a.finalBuyWealth, b.finalBuyWealth, a.winner) },
      { label: 'Χαρτοφυλάκιο (ενοίκιο)', valueA: fmt(a.finalRentWealth), valueB: fmt(b.finalRentWealth), highlight: pickWealth(a.finalRentWealth, b.finalRentWealth, a.winner === 'buy' ? 'rent' : a.winner === 'rent' ? 'buy' : 'tie') },
      { label: 'Καλύτερη επιλογή', valueA: winnerLabel(a.winner), valueB: winnerLabel(b.winner) },
    ];
  });

  shareSummary = computed(() => {
    const r = this.result();
    const w = r.winner === 'buy' ? 'Αγορά' : r.winner === 'rent' ? 'Ενοίκιο' : 'Ισοδύναμα';
    return `Νοικιάζω ή Αγοράζω Salaries.gr: ${w} συμφέρει σε ${this.formModel().timeHorizon} έτη`;
  });

  onPropertyPriceInput(): void {
    this.syncDerivedAmounts();
  }

  onDownPaymentModeChange(mode: 'pct' | 'amount'): void {
    this.formModel.update(m => ({ ...m, downPaymentMode: mode }));
    this.syncDownPaymentPair(mode);
  }

  onDownPaymentPctInput(): void {
    this.syncDownPaymentPair('pct');
  }

  onDownPaymentAmountInput(): void {
    this.syncDownPaymentPair('amount');
  }

  onClosingCostsModeChange(mode: 'pct' | 'amount'): void {
    this.formModel.update(m => ({ ...m, closingCostsMode: mode }));
    this.syncClosingCostsPair(mode);
  }

  onClosingCostsPctInput(): void {
    this.syncClosingCostsPair('pct');
  }

  onClosingCostsAmountInput(): void {
    this.syncClosingCostsPair('amount');
  }

  private syncDerivedAmounts(): void {
    const m = this.formModel();
    const downPaymentMode = m.downPaymentMode === 'amount' ? 'amount' : 'pct';
    const closingCostsMode = m.closingCostsMode === 'amount' ? 'amount' : 'pct';
    this.syncDownPaymentPair(downPaymentMode);
    this.syncClosingCostsPair(closingCostsMode);
  }

  private syncDownPaymentPair(source: 'pct' | 'amount'): void {
    const m = this.formModel();
    const propertyPrice = Math.max(0, Number(m.propertyPrice) || 0);
    if (source === 'pct') {
      const pct = Math.min(100, Math.max(0, Number(m.downPaymentPct) || 0));
      const amount = +(propertyPrice * pct / 100).toFixed(2);
      this.formModel.update(v => ({ ...v, downPaymentPct: pct, downPaymentAmount: amount }));
      return;
    }

    const amount = Math.min(propertyPrice, Math.max(0, Number(m.downPaymentAmount) || 0));
    const pct = propertyPrice > 0 ? +(amount / propertyPrice * 100).toFixed(2) : 0;
    this.formModel.update(v => ({ ...v, downPaymentAmount: amount, downPaymentPct: pct }));
  }

  private syncClosingCostsPair(source: 'pct' | 'amount'): void {
    const m = this.formModel();
    const propertyPrice = Math.max(0, Number(m.propertyPrice) || 0);
    if (source === 'pct') {
      const pct = Math.max(0, Number(m.closingCostsPct) || 0);
      const amount = +(propertyPrice * pct / 100).toFixed(2);
      this.formModel.update(v => ({ ...v, closingCostsPct: pct, closingCostsAmount: amount }));
      return;
    }

    const amount = Math.max(0, Number(m.closingCostsAmount) || 0);
    const pct = propertyPrice > 0 ? +(amount / propertyPrice * 100).toFixed(2) : 0;
    this.formModel.update(v => ({ ...v, closingCostsAmount: amount, closingCostsPct: pct }));
  }

  private patchLoadedState(state: Record<string, unknown>, model = this.formModel): void {
    if (state['downPaymentMode'] == null) state['downPaymentMode'] = 'pct';
    if (state['closingCostsMode'] == null) state['closingCostsMode'] = 'pct';
    if (state['downPaymentAmount'] == null) {
      const price = Math.max(0, Number(state['propertyPrice']) || 0);
      const pct = Math.min(100, Math.max(0, Number(state['downPaymentPct']) || 0));
      state['downPaymentAmount'] = +(price * pct / 100).toFixed(2);
    }
    if (state['closingCostsAmount'] == null) {
      const price = Math.max(0, Number(state['propertyPrice']) || 0);
      const pct = Math.max(0, Number(state['closingCostsPct']) || 0);
      state['closingCostsAmount'] = +(price * pct / 100).toFixed(2);
    }
    model.set({ ...model(), ...state } as RentVsBuyModel);
  }
}
