import { Injectable } from '@angular/core';
import {
  AmortizationRow,
  EarlyRepayment,
  ErMonthsSavedMap,
  LoanParams,
  MortgageSummary,
} from '../models/mortgage.models';
import {
  buildMortgageSchedule,
  computeMortgageErMonthsSaved,
  computeMortgageSummary,
  mortgagePmt,
} from '../calculators/mortgage/mortgage.calc';

@Injectable({ providedIn: 'root' })
export class MortgageCalculatorService {
  pmt(principal: number, annualRate: number, months: number): number {
    return mortgagePmt(principal, annualRate, months);
  }

  buildSchedule(params: LoanParams, erList: EarlyRepayment[]): AmortizationRow[] {
    return buildMortgageSchedule(params, erList);
  }

  computeSummary(
    schedule: AmortizationRow[],
    baseSchedule: AmortizationRow[],
    params: LoanParams,
  ): MortgageSummary {
    return computeMortgageSummary(schedule, baseSchedule, params);
  }

  computeErMonthsSaved(params: LoanParams, erList: EarlyRepayment[]): ErMonthsSavedMap {
    return computeMortgageErMonthsSaved(params, erList);
  }
}
