import { Injectable } from '@angular/core';
import {
  calculateUnusedLeave,
  LeaveResult,
  TaxBracket,
  UnusedLeaveParams,
} from '../calculators/unused-leave/unused-leave.calc';

export type { LeaveResult, TaxBracket, UnusedLeaveParams };

@Injectable({ providedIn: 'root' })
export class UnusedLeaveCalculatorService {
  calculate(params: UnusedLeaveParams): LeaveResult {
    return calculateUnusedLeave(params);
  }
}
