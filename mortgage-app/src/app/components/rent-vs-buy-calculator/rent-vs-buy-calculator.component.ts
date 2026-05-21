import { Component, computed, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { CompareRow } from '../compare-panel/compare-panel.component';
import { ShareStateService } from '../../services/share-state.service';

const STORAGE_KEY = 'rentVsBuyCalcState';

interface YearlyRow {
  year: number;
  buyWealth: number;
  rentWealth: number;
  buyAhead: boolean;
}

interface RentVsBuyResult {
  monthlyPayment: number;
  loanAmount: number;
  downPayment: number;
  downPaymentPct: number;
  closingCosts: number;
  closingCostsPct: number;
  yearlyRows: YearlyRow[];
  breakEvenYear: number | null;
  finalBuyWealth: number;
  finalRentWealth: number;
  winner: 'buy' | 'rent' | 'tie';
  advantage: number;
}

@Component({
  selector: 'app-rent-vs-buy-calculator',
  standalone: false,
  templateUrl: './rent-vs-buy-calculator.component.html',
  styleUrl: './rent-vs-buy-calculator.component.scss',
})
export class RentVsBuyCalculatorComponent implements OnInit {
  form: FormGroup;
  private formValues;

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
    private shareSvc: ShareStateService,
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
    this.loadState();
    const qp = this.shareSvc.getQueryParams();
    if (Object.keys(qp).length) {
      this.form.patchValue(this.shareSvc.deserializeState(qp), { emitEvent: false });
    }
    this.form.valueChanges.subscribe(() => this.saveState());
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
    return this.computeRentVsBuy(this.form.value, horizon);
  });

  compareResult = computed(() => {
    this.formValues();
    const horizon = Math.min(40, Math.max(1, Number(this.form.value.compareTimeHorizon) || 10));
    return this.computeRentVsBuy(this.form.value, horizon);
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

  private computeRentVsBuy(fv: Record<string, unknown>, timeHorizon: number): RentVsBuyResult {
    const propertyPrice = Math.max(0, Number(fv['propertyPrice']) || 0);
    const downPaymentMode = fv['downPaymentMode'] === 'amount' ? 'amount' : 'pct';
    const closingCostsMode = fv['closingCostsMode'] === 'amount' ? 'amount' : 'pct';
    const downPaymentPctInput = Math.min(100, Math.max(0, Number(fv['downPaymentPct']) ?? 20));
    const closingCostsPctInput = Math.max(0, Number(fv['closingCostsPct']) ?? 3);
    const mortgageRate = Math.max(0, Number(fv['mortgageRate']) ?? 3.5);
    const mortgageTerm = Math.max(1, Math.min(40, Number(fv['mortgageTerm']) || 30));
    const monthlyRent = Math.max(0, Number(fv['monthlyRent']) || 0);
    const rentGrowthRate = Number(fv['rentGrowthRate']) ?? 3;
    const propertyGrowthRate = Number(fv['propertyGrowthRate']) ?? 2;
    const investmentReturn = Math.max(0, Number(fv['investmentReturn']) ?? 5);
    const annualOwnershipCostPct = Math.max(0, Number(fv['annualOwnershipCostPct']) ?? 1);
    const horizon = Math.min(40, Math.max(1, timeHorizon));

    const downPayment = downPaymentMode === 'amount'
      ? Math.min(propertyPrice, Math.max(0, Number(fv['downPaymentAmount']) || 0))
      : propertyPrice * downPaymentPctInput / 100;
    const downPaymentPct = propertyPrice > 0 ? downPayment / propertyPrice * 100 : 0;
    const loanAmount = propertyPrice - downPayment;
    const closingCosts = closingCostsMode === 'amount'
      ? Math.max(0, Number(fv['closingCostsAmount']) || 0)
      : propertyPrice * closingCostsPctInput / 100;
    const closingCostsPct = propertyPrice > 0 ? closingCosts / propertyPrice * 100 : 0;

    const n = mortgageTerm * 12;
    const r = mortgageRate / 100 / 12;

    let monthlyPayment = 0;
    if (loanAmount > 0) {
      if (r === 0) {
        monthlyPayment = loanAmount / n;
      } else {
        const pow = Math.pow(1 + r, n);
        monthlyPayment = loanAmount * r * pow / (pow - 1);
      }
    }

    const powN = r > 0 ? Math.pow(1 + r, n) : 1;
    const monthlyInvestRate = investmentReturn / 100 / 12;

    let portfolio = downPayment + closingCosts;

    const yearlyRows: YearlyRow[] = [];
    let breakEvenYear: number | null = null;
    let prevBuyAhead = false;

    for (let year = 1; year <= horizon; year++) {
      for (let m = 0; m < 12; m++) {
        const totalMonth = (year - 1) * 12 + m + 1;
        const propValMonth = propertyPrice * Math.pow(1 + propertyGrowthRate / 100, totalMonth / 12);
        const rentThisMonth = monthlyRent * Math.pow(1 + rentGrowthRate / 100, year - 1);
        const ownershipThisMonth = propValMonth * annualOwnershipCostPct / 100 / 12;
        const buyerMonthly = (totalMonth <= n ? monthlyPayment : 0) + ownershipThisMonth;
        const delta = buyerMonthly - rentThisMonth;
        portfolio = portfolio * (1 + monthlyInvestRate) + delta;
      }

      const propVal_y = propertyPrice * Math.pow(1 + propertyGrowthRate / 100, year);
      const totalMonths_y = year * 12;
      let remainingBal_y = 0;
      if (totalMonths_y < n && loanAmount > 0) {
        if (r > 0) {
          const powM = Math.pow(1 + r, totalMonths_y);
          remainingBal_y = loanAmount * (powN - powM) / (powN - 1);
        } else {
          remainingBal_y = loanAmount * (1 - totalMonths_y / n);
        }
      }

      const equity_y = propVal_y - remainingBal_y;
      const buyAhead = equity_y > portfolio;

      if (buyAhead && !prevBuyAhead && breakEvenYear === null) {
        breakEvenYear = year;
      }
      prevBuyAhead = buyAhead;

      yearlyRows.push({ year, buyWealth: equity_y, rentWealth: portfolio, buyAhead });
    }

    const finalRow = yearlyRows[yearlyRows.length - 1];
    const finalBuyWealth = finalRow?.buyWealth ?? 0;
    const finalRentWealth = finalRow?.rentWealth ?? 0;
    const diff = finalBuyWealth - finalRentWealth;

    let winner: 'buy' | 'rent' | 'tie';
    if (Math.abs(diff) < 1000) {
      winner = 'tie';
    } else if (diff > 0) {
      winner = 'buy';
    } else {
      winner = 'rent';
    }

    if (winner !== 'buy') {
      breakEvenYear = null;
    }

    return {
      monthlyPayment,
      loanAmount,
      downPayment,
      downPaymentPct,
      closingCosts,
      closingCostsPct,
      yearlyRows,
      breakEvenYear,
      finalBuyWealth,
      finalRentWealth,
      winner,
      advantage: Math.abs(diff),
    };
  }

  onPropertyPriceInput(): void {
    this.syncDerivedAmounts();
  }

  onDownPaymentModeChange(mode: 'pct' | 'amount'): void {
    this.form.patchValue({ downPaymentMode: mode });
    this.syncDownPaymentPair(mode);
    this.saveState();
  }

  onDownPaymentPctInput(): void {
    this.syncDownPaymentPair('pct');
    this.saveState();
  }

  onDownPaymentAmountInput(): void {
    this.syncDownPaymentPair('amount');
    this.saveState();
  }

  onClosingCostsModeChange(mode: 'pct' | 'amount'): void {
    this.form.patchValue({ closingCostsMode: mode });
    this.syncClosingCostsPair(mode);
    this.saveState();
  }

  onClosingCostsPctInput(): void {
    this.syncClosingCostsPair('pct');
    this.saveState();
  }

  onClosingCostsAmountInput(): void {
    this.syncClosingCostsPair('amount');
    this.saveState();
  }

  private syncDerivedAmounts(): void {
    const downPaymentMode = this.form.get('downPaymentMode')?.value === 'amount' ? 'amount' : 'pct';
    const closingCostsMode = this.form.get('closingCostsMode')?.value === 'amount' ? 'amount' : 'pct';
    this.syncDownPaymentPair(downPaymentMode);
    this.syncClosingCostsPair(closingCostsMode);
    this.saveState();
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

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.form.value));
    } catch { /* storage unavailable */ }
  }

  private loadState(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const state = JSON.parse(raw);
      if (!state) return;
      if (state.downPaymentMode == null) state.downPaymentMode = 'pct';
      if (state.closingCostsMode == null) state.closingCostsMode = 'pct';
      if (state.downPaymentAmount == null) {
        const price = Math.max(0, Number(state.propertyPrice) || 0);
        const pct = Math.min(100, Math.max(0, Number(state.downPaymentPct) || 0));
        state.downPaymentAmount = +(price * pct / 100).toFixed(2);
      }
      if (state.closingCostsAmount == null) {
        const price = Math.max(0, Number(state.propertyPrice) || 0);
        const pct = Math.max(0, Number(state.closingCostsPct) || 0);
        state.closingCostsAmount = +(price * pct / 100).toFixed(2);
      }
      this.form.patchValue(state, { emitEvent: false });
    } catch { /* ignore */ }
  }
}
