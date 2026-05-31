import { Injectable } from '@angular/core';
import {
  calculateInterest,
  InterestParams,
  InterestResult,
} from '../calculators/interest/interest.calc';

export type { InterestParams, InterestResult };

@Injectable({ providedIn: 'root' })
export class InterestCalculatorService {
  calculate(params: InterestParams): InterestResult {
    return calculateInterest(params);
  }
}
