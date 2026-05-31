import { Injectable } from '@angular/core';
import {
  AgeGroup,
  MultiEmployerParams,
  MultiEmployerResult,
  SalaryParams,
  SalaryResult,
  TaxBracketResult,
} from '../models/salary.models';
import {
  buildSalaryParams,
  calculateMultiEmployerSalary,
  calculateSalary,
  calculateTaxOnlySalary,
  calculateWithPartialBonusesSalary,
  HolidayBonusResult,
  PartialBonusParams,
  reverseCalculateSalary,
  SalaryFormSlice,
} from '../calculators/salary/salary.calc';

export type {
  AdjustedBonus,
  HolidayBonusResult,
  PartialBonusParams,
  SalaryFormSlice,
} from '../calculators/salary/salary.calc';

@Injectable({ providedIn: 'root' })
export class SalaryCalculatorService {
  calculate(params: SalaryParams): SalaryResult {
    return calculateSalary(params);
  }

  buildSalaryParams(form: SalaryFormSlice, extras?: { annualBonus?: number }): SalaryParams {
    return buildSalaryParams(form, extras);
  }

  reverseCalculate(netTarget: number, params: SalaryParams): number {
    return reverseCalculateSalary(netTarget, params);
  }

  calculateMultiEmployer(params: MultiEmployerParams): MultiEmployerResult {
    return calculateMultiEmployerSalary(params);
  }

  calculateWithPartialBonuses(params: PartialBonusParams): HolidayBonusResult {
    return calculateWithPartialBonusesSalary(params);
  }

  calculateTaxOnly(
    taxableIncome: number,
    year: number,
    ageGroup: AgeGroup,
    children: number,
  ): {
    totalTax: number;
    breakdown: TaxBracketResult[];
    taxDiscount: number;
    annualTax: number;
  } {
    return calculateTaxOnlySalary(taxableIncome, year, ageGroup, children);
  }
}
