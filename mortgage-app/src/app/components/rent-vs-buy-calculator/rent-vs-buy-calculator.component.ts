import { Component, computed, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

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

  constructor(private fb: FormBuilder) {
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
    });
    this.formValues = toSignal(this.form.valueChanges, { initialValue: this.form.value });
  }

  ngOnInit(): void {
    this.loadState();
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
    const fv = this.form.value;

    const propertyPrice = Math.max(0, fv.propertyPrice || 0);
    const downPaymentMode = fv.downPaymentMode === 'amount' ? 'amount' : 'pct';
    const closingCostsMode = fv.closingCostsMode === 'amount' ? 'amount' : 'pct';
    const downPaymentPctInput = Math.min(100, Math.max(0, fv.downPaymentPct ?? 20));
    const closingCostsPctInput = Math.max(0, fv.closingCostsPct ?? 3);
    const mortgageRate = Math.max(0, fv.mortgageRate ?? 3.5);
    const mortgageTerm = Math.max(1, Math.min(40, fv.mortgageTerm || 30));
    const monthlyRent = Math.max(0, fv.monthlyRent || 0);
    const rentGrowthRate = fv.rentGrowthRate ?? 3;
    const propertyGrowthRate = fv.propertyGrowthRate ?? 2;
    const investmentReturn = Math.max(0, fv.investmentReturn ?? 5);
    const annualOwnershipCostPct = Math.max(0, fv.annualOwnershipCostPct ?? 1);
    const timeHorizon = Math.min(40, Math.max(1, fv.timeHorizon || 20));

    const downPayment = downPaymentMode === 'amount'
      ? Math.min(propertyPrice, Math.max(0, fv.downPaymentAmount || 0))
      : propertyPrice * downPaymentPctInput / 100;
    const downPaymentPct = propertyPrice > 0 ? downPayment / propertyPrice * 100 : 0;
    const loanAmount = propertyPrice - downPayment;
    const closingCosts = closingCostsMode === 'amount'
      ? Math.max(0, fv.closingCostsAmount || 0)
      : propertyPrice * closingCostsPctInput / 100;
    const closingCostsPct = propertyPrice > 0 ? closingCosts / propertyPrice * 100 : 0;

    // Mortgage params
    const n = mortgageTerm * 12;
    const r = mortgageRate / 100 / 12;

    // PMT
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

    // Renter starts by investing the down payment + closing costs (capital they didn't tie up in the house)
    let portfolio = downPayment + closingCosts;

    const yearlyRows: YearlyRow[] = [];
    let breakEvenYear: number | null = null;
    let prevBuyAhead = false;

    for (let year = 1; year <= timeHorizon; year++) {
      // Simulate month-by-month within this year
      for (let m = 0; m < 12; m++) {
        const totalMonth = (year - 1) * 12 + m + 1;

        // Property value this month
        const propValMonth = propertyPrice * Math.pow(1 + propertyGrowthRate / 100, totalMonth / 12);

        // Rent grows at start of each new year
        const rentThisMonth = monthlyRent * Math.pow(1 + rentGrowthRate / 100, year - 1);

        // Buyer's monthly outgoings: mortgage payment (until paid off) + ownership costs
        const ownershipThisMonth = propValMonth * annualOwnershipCostPct / 100 / 12;
        const buyerMonthly = (totalMonth <= n ? monthlyPayment : 0) + ownershipThisMonth;

        // Monthly delta: what buyer pays minus what renter pays → renter invests the difference
        const delta = buyerMonthly - rentThisMonth;

        // Grow portfolio at investment rate and add delta (renter invests the difference)
        portfolio = portfolio * (1 + monthlyInvestRate) + delta;
      }

      // Buyer equity at end of year y
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

    // Only show break-even if buying wins at the end — otherwise the crossover is misleading
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
  });

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
