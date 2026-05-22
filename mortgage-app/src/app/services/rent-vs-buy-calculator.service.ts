import { Injectable } from '@angular/core';
import { MortgageCalculatorService } from './mortgage-calculator.service';

export interface YearlyRow {
  year: number;
  buyWealth: number;
  rentWealth: number;
  buyAhead: boolean;
}

export interface RentVsBuyParams {
  propertyPrice?: number;
  downPaymentMode?: 'pct' | 'amount' | string;
  downPaymentPct?: number;
  downPaymentAmount?: number;
  closingCostsMode?: 'pct' | 'amount' | string;
  closingCostsPct?: number;
  closingCostsAmount?: number;
  mortgageRate?: number;
  mortgageTerm?: number;
  monthlyRent?: number;
  rentGrowthRate?: number;
  propertyGrowthRate?: number;
  investmentReturn?: number;
  annualOwnershipCostPct?: number;
}

export interface RentVsBuyResult {
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

@Injectable({ providedIn: 'root' })
export class RentVsBuyCalculatorService {
  constructor(private mortgageService: MortgageCalculatorService) {}

  calculate(params: RentVsBuyParams, timeHorizon: number): RentVsBuyResult {
    const propertyPrice = Math.max(0, Number(params.propertyPrice) || 0);
    const downPaymentMode = params.downPaymentMode === 'amount' ? 'amount' : 'pct';
    const closingCostsMode = params.closingCostsMode === 'amount' ? 'amount' : 'pct';
    const downPaymentPctInput = Math.min(100, Math.max(0, Number(params.downPaymentPct) ?? 20));
    const closingCostsPctInput = Math.max(0, Number(params.closingCostsPct) ?? 3);
    const mortgageRate = Math.max(0, Number(params.mortgageRate) ?? 3.5);
    const mortgageTerm = Math.max(1, Math.min(40, Number(params.mortgageTerm) || 30));
    const monthlyRent = Math.max(0, Number(params.monthlyRent) || 0);
    const rentGrowthRate = Number(params.rentGrowthRate) ?? 3;
    const propertyGrowthRate = Number(params.propertyGrowthRate) ?? 2;
    const investmentReturn = Math.max(0, Number(params.investmentReturn) ?? 5);
    const annualOwnershipCostPct = Math.max(0, Number(params.annualOwnershipCostPct) ?? 1);
    const horizon = Math.min(40, Math.max(1, timeHorizon));

    const downPayment = downPaymentMode === 'amount'
      ? Math.min(propertyPrice, Math.max(0, Number(params.downPaymentAmount) || 0))
      : propertyPrice * downPaymentPctInput / 100;
    const downPaymentPct = propertyPrice > 0 ? downPayment / propertyPrice * 100 : 0;
    const loanAmount = propertyPrice - downPayment;
    const closingCosts = closingCostsMode === 'amount'
      ? Math.max(0, Number(params.closingCostsAmount) || 0)
      : propertyPrice * closingCostsPctInput / 100;
    const closingCostsPct = propertyPrice > 0 ? closingCosts / propertyPrice * 100 : 0;

    const n = mortgageTerm * 12;
    const r = mortgageRate / 100 / 12;

    const monthlyPayment = this.mortgageService.pmt(loanAmount, mortgageRate, n);

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
}
