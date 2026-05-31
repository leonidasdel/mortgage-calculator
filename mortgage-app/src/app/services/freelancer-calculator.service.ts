import { Injectable } from '@angular/core';
import {
  calculateFreelancer,
  EFKA_CATEGORIES,
  EfkaComparison,
  FreelancerParams,
  FreelancerResult,
  TaxBracketRow,
} from '../calculators/freelancer/freelancer.calc';

export type { EfkaComparison, FreelancerParams, FreelancerResult, TaxBracketRow };
export { EFKA_CATEGORIES };

@Injectable({ providedIn: 'root' })
export class FreelancerCalculatorService {
  calculate(params: FreelancerParams): FreelancerResult {
    return calculateFreelancer(params);
  }
}
