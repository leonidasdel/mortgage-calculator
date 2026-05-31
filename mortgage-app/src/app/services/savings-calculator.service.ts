import { Injectable } from '@angular/core';
import {
  calculateSavings,
  SavingsParams,
  SavingsResult,
  SavingsYearRow,
} from '../calculators/savings/savings.calc';

export type { SavingsParams, SavingsResult, SavingsYearRow };

@Injectable({ providedIn: 'root' })
export class SavingsCalculatorService {
  calculate(params: SavingsParams, monthlyOverride?: number): SavingsResult {
    return calculateSavings(params, monthlyOverride);
  }
}
