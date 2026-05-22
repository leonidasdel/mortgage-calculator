import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { CompareRow } from '../compare-panel/compare-panel.component';
import { CalculatorPersistenceService } from '../../services/calculator-persistence.service';
import {
  RentVsBuyCalculatorService,
  RentVsBuyResult,
} from '../../services/rent-vs-buy-calculator.service';

const STORAGE_KEY = 'rentVsBuyCalcState';

import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { EuroPipe } from '../../pipes/euro.pipe';
import { CalcExplanationComponent } from '../calc-explanation/calc-explanation.component';
import { ComparePanelComponent } from '../compare-panel/compare-panel.component';
import { ExportRowComponent } from '../export-row/export-row.component';
import { LawFooterComponent } from '../law-footer/law-footer.component';
@Component({
  selector: 'app-rent-vs-buy-calculator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, EuroPipe, CalcExplanationComponent, ComparePanelComponent, ExportRowComponent, LawFooterComponent],
  templateUrl: './rent-vs-buy-calculator.component.html',
  styleUrl: './rent-vs-buy-calculator.component.scss',
})
export class RentVsBuyCalculatorComponent implements OnInit {
  form: FormGroup;
  private formValues;
  private destroyRef = inject(DestroyRef);

  readonly explanationSteps = [
    'Ο ενοικιαστής επενδύει την προκαταβολή και τα έξοδα αγοράς σε χαρτοφυλάκιο.',
    'Κάθε μήνα επενδύεται η διαφορά δαπανών (δόση + συντήρηση − ενοίκιο).',
    'Ο αγοραστής συσσωρεύει ίδια κεφάλαια (αξία − υπόλοιπο δανείου).',
    'Συγκρίνονται τα τελικά ποσά στο τέλος του χρονικού ορίζοντα.',
  ];

  readonly explanationFormula =
    'Πλούτος αγοράς = αξία ακινήτου − υπόλοιπο · Πλούτος ενοικίου = επενδύσεις';

  constructor(
    private fb: FormBuilder,
    private calc: RentVsBuyCalculatorService,
    private persistence: CalculatorPersistenceService,
  ) {
    this.form = this.fb.group({
      propertyPrice: [250000],
      downPaymentMode: ['pct'],
      downPaymentPct: [20],
      downPaymentAmount: [50000],
      closingCostsMode: ['pct'],
      closingCostsPct: [3],
      closingCostsAmount: [7500],
      mortgageRate: [3.5],
      mortgageTerm: [30],
      monthlyRent: [900],
      rentGrowthRate: [3],
      propertyGrowthRate: [1],
      investmentReturn: [5],
      annualOwnershipCostPct: [0.5],
      timeHorizon: [20],
      compareTimeHorizon: [10],
    });
    this.formValues = toSignal(this.form.valueChanges, { initialValue: this.form.value });
  }

  ngOnInit(): void {
    this.persistence.initCalculatorForm(this.form, STORAGE_KEY, this.destroyRef, {
      onLoad: (state) => this.patchLoadedState(state),
      onApplyShareState: (state) => this.patchLoadedState(state),
    });
  }

  rentProjections = computed(() => {
    this.formValues();
    const fv = this.form.value;
    const monthly = Math.max(0, fv.monthlyRent || 0);
    const growth = fv.rentGrowthRate ?? 3;
    return [3, 5, 10].map(y => ({
      years: y,
      rent: Math.round(monthly * Math.pow(1 + growth / 100, y)),
    }));
  });

  result = computed<RentVsBuyResult>(() => {
    this.formValues();
    const horizon = Math.min(40, Math.max(1, Number(this.form.value.timeHorizon) || 20));
    return this.calc.calculate(this.form.value, horizon);
  });

  compareResult = computed(() => {
    this.formValues();
    const horizon = Math.min(40, Math.max(1, Number(this.form.value.compareTimeHorizon) || 10));
    return this.calc.calculate(this.form.value, horizon);
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
    const hA = Number(this.form.value.timeHorizon) || 20;
    const hB = Number(this.form.value.compareTimeHorizon) || 10;
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
    return `Νοικιάζω ή Αγοράζω Salaries.gr: ${w} συμφέρει σε ${this.form.value.timeHorizon} έτη`;
  });

  onPropertyPriceInput(): void {
    this.syncDerivedAmounts();
  }

  onDownPaymentModeChange(mode: 'pct' | 'amount'): void {
    this.form.patchValue({ downPaymentMode: mode });
    this.syncDownPaymentPair(mode);
  }

  onDownPaymentPctInput(): void {
    this.syncDownPaymentPair('pct');
  }

  onDownPaymentAmountInput(): void {
    this.syncDownPaymentPair('amount');
  }

  onClosingCostsModeChange(mode: 'pct' | 'amount'): void {
    this.form.patchValue({ closingCostsMode: mode });
    this.syncClosingCostsPair(mode);
  }

  onClosingCostsPctInput(): void {
    this.syncClosingCostsPair('pct');
  }

  onClosingCostsAmountInput(): void {
    this.syncClosingCostsPair('amount');
  }

  private syncDerivedAmounts(): void {
    const downPaymentMode = this.form.get('downPaymentMode')?.value === 'amount' ? 'amount' : 'pct';
    const closingCostsMode = this.form.get('closingCostsMode')?.value === 'amount' ? 'amount' : 'pct';
    this.syncDownPaymentPair(downPaymentMode);
    this.syncClosingCostsPair(closingCostsMode);
  }

  private syncDownPaymentPair(source: 'pct' | 'amount'): void {
    const propertyPrice = Math.max(0, Number(this.form.get('propertyPrice')?.value) || 0);
    if (source === 'pct') {
      const pct = Math.min(100, Math.max(0, Number(this.form.get('downPaymentPct')?.value) || 0));
      const amount = +(propertyPrice * pct / 100).toFixed(2);
      this.form.patchValue({ downPaymentPct: pct, downPaymentAmount: amount });
      return;
    }

    const amount = Math.min(propertyPrice, Math.max(0, Number(this.form.get('downPaymentAmount')?.value) || 0));
    const pct = propertyPrice > 0 ? +(amount / propertyPrice * 100).toFixed(2) : 0;
    this.form.patchValue({ downPaymentAmount: amount, downPaymentPct: pct });
  }

  private syncClosingCostsPair(source: 'pct' | 'amount'): void {
    const propertyPrice = Math.max(0, Number(this.form.get('propertyPrice')?.value) || 0);
    if (source === 'pct') {
      const pct = Math.max(0, Number(this.form.get('closingCostsPct')?.value) || 0);
      const amount = +(propertyPrice * pct / 100).toFixed(2);
      this.form.patchValue({ closingCostsPct: pct, closingCostsAmount: amount });
      return;
    }

    const amount = Math.max(0, Number(this.form.get('closingCostsAmount')?.value) || 0);
    const pct = propertyPrice > 0 ? +(amount / propertyPrice * 100).toFixed(2) : 0;
    this.form.patchValue({ closingCostsAmount: amount, closingCostsPct: pct });
  }

  private patchLoadedState(state: Record<string, unknown>): void {
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
    this.form.patchValue(state, { emitEvent: false });
  }
}
