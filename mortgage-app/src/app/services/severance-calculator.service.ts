import { Injectable } from '@angular/core';
import {
  calculateSeverance,
  SeveranceParams,
  SeveranceResult,
  TerminationType,
} from '../calculators/severance/severance.calc';

export type { SeveranceParams, SeveranceResult, TerminationType };

@Injectable({ providedIn: 'root' })
export class SeveranceCalculatorService {
  calculate(params: SeveranceParams): SeveranceResult {
    return calculateSeverance(params);
  }
}
