import { Injectable } from '@angular/core';
import {
  AmortizationRow,
  EarlyRepayment,
  ErMonthsSavedMap,
  LoanParams,
  MortgageSummary,
} from '../models/mortgage.models';

@Injectable({ providedIn: 'root' })
export class MortgageCalculatorService {

  pmt(principal: number, annualRate: number, months: number): number {
    if (principal <= 0 || months <= 0) return 0;
    if (annualRate === 0) return principal / months;
    const r = annualRate / 100 / 12;
    const f = Math.pow(1 + r, months);
    return principal * r * f / (f - 1);
  }

  buildSchedule(params: LoanParams, erList: EarlyRepayment[]): AmortizationRow[] {
    const loanAmount  = params.loanAmount;
    const loanYears   = Math.max(1, Math.round(params.loanYears));
    const fixedYears  = Math.max(0, Math.round(params.fixedYears));
    const fixedRate   = params.fixedRate;
    const varRate     = params.euribor + params.bankMargin;
    const graceMonths = Math.max(0, Math.round(params.gracePeriod));
    const erMode      = params.erMode;

    const totalMonths = loanYears * 12;
    const fixedMonths = Math.min(fixedYears * 12, totalMonths);
    const n128pm      = loanAmount * 0.0012 / 12;

    const today = new Date();
    let balance = loanAmount;
    const rows: AmortizationRow[] = [];

    const amortMonths = totalMonths - graceMonths;
    let pmtFixed = this.pmt(loanAmount, fixedRate, amortMonths > 0 ? amortMonths : totalMonths);
    let pmtVar   = 0;
    let varPhaseStarted = false;

    // Pre-calculate natural (no-prepayment) variable-phase PMT for reduceDur mode.
    let naturalPmtVar = 0;
    if (fixedMonths > 0 && fixedMonths < totalMonths) {
      let natBal = loanAmount;
      const fxMRate = fixedRate / 100 / 12;
      for (let i = 1; i <= fixedMonths; i++) {
        if (i <= graceMonths) continue;
        const intr = natBal * fxMRate;
        natBal = Math.max(0, natBal - Math.max(0, pmtFixed - intr));
      }
      naturalPmtVar = this.pmt(natBal, varRate, totalMonths - fixedMonths);
    }

    for (let m = 1; m <= totalMonths; m++) {
      if (balance < 0.005) break;

      const isGrace = m <= graceMonths;
      const isFixed = m <= fixedMonths;
      const rate    = isFixed ? fixedRate : varRate;
      const mRate   = rate / 100 / 12;
      const payDate = this.addMonths(today, m);

      if (!isFixed && !varPhaseStarted) {
        if (erMode === 'reduceDur' && naturalPmtVar > 0) {
          pmtVar = naturalPmtVar;
        } else {
          const remMonths = totalMonths - m + 1;
          pmtVar = this.pmt(balance, varRate, remMonths > 0 ? remMonths : 1);
        }
        varPhaseStarted = true;
      }

      const interest  = balance * mRate;
      let principal   = 0;
      let basePmt     = 0;

      if (isGrace) {
        basePmt   = interest;
        principal = 0;
      } else {
        basePmt   = isFixed ? pmtFixed : pmtVar;
        principal = Math.min(Math.max(0, basePmt - interest), balance);
      }

      let earlyAmt = 0;
      const er = erList.find(e => e.month === m);
      if (er && er.amount > 0) {
        earlyAmt = Math.min(er.amount, balance - principal);
        if (earlyAmt < 0) earlyAmt = 0;
        const afterBalance = balance - principal - earlyAmt;
        const remMonths    = totalMonths - m;
        if (erMode === 'reducePmt' && remMonths > 0 && afterBalance > 0.01) {
          if (isFixed) {
            pmtFixed = this.pmt(afterBalance, fixedRate, remMonths);
          } else {
            pmtVar = this.pmt(afterBalance, varRate, remMonths);
          }
        }
      }

      const newBalance   = Math.max(0, balance - principal - earlyAmt);
      const totalPayment = (isGrace ? interest : basePmt) + n128pm;

      rows.push({ month: m, date: payDate, payment: totalPayment, principal, interest, n128: n128pm, earlyAmt, balance: newBalance, isGrace, isFixed, rate });

      balance = newBalance;
    }

    return rows;
  }

  computeSummary(
    schedule: AmortizationRow[],
    baseSchedule: AmortizationRow[],
    params: LoanParams,
  ): MortgageSummary {
    if (!schedule.length) {
      return { fixedPayment: 0, variablePayment: 0, totalPrincipal: 0, totalInterest: 0, totalN128: 0, grandTotal: 0, actualMonths: 0, varRate: params.euribor + params.bankMargin };
    }

    const totalInterest  = schedule.reduce((s, r) => s + r.interest, 0);
    const totalN128      = schedule.reduce((s, r) => s + r.n128, 0);
    const totalPrincipal = schedule.reduce((s, r) => s + r.principal + r.earlyAmt, 0);
    const grandTotal     = totalPrincipal + totalInterest + totalN128;
    const actualMonths   = schedule.length;
    const varRate        = params.euribor + params.bankMargin;

    const firstAmort = schedule.find(r => !r.isGrace);
    const firstVar   = schedule.find(r => !r.isFixed && !r.isGrace);
    const fixedPayment    = firstAmort ? firstAmort.payment : schedule[0].payment;
    const variablePayment = firstVar   ? firstVar.payment   : fixedPayment;

    let baseInterest: number | undefined;
    let interestSaved: number | undefined;
    let monthsSaved: number | undefined;

    if (baseSchedule.length > 0 && baseSchedule.length !== schedule.length) {
      baseInterest  = baseSchedule.reduce((s, r) => s + r.interest, 0);
      interestSaved = baseInterest - totalInterest;
      monthsSaved   = baseSchedule.length - actualMonths;
    } else if (baseSchedule.length > 0) {
      baseInterest  = baseSchedule.reduce((s, r) => s + r.interest, 0);
      interestSaved = Math.max(0, baseInterest - totalInterest);
      monthsSaved   = Math.max(0, baseSchedule.length - actualMonths);
    }

    return { fixedPayment, variablePayment, totalPrincipal, totalInterest, totalN128, grandTotal, actualMonths, varRate, baseInterest, interestSaved, monthsSaved };
  }

  computeErMonthsSaved(params: LoanParams, erList: EarlyRepayment[]): ErMonthsSavedMap {
    const result: ErMonthsSavedMap = {};
    if (!erList.length) return result;
    const sorted = [...erList].sort((a, b) => a.month - b.month);
    for (let i = 0; i < sorted.length; i++) {
      const prevLen = this.buildSchedule(params, sorted.slice(0, i)).length;
      const withLen = this.buildSchedule(params, sorted.slice(0, i + 1)).length;
      result[sorted[i].id] = Math.max(0, prevLen - withLen);
    }
    return result;
  }

  private addMonths(base: Date, n: number): Date {
    return new Date(base.getFullYear(), base.getMonth() + n, base.getDate());
  }
}
