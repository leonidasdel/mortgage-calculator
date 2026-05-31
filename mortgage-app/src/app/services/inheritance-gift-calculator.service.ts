import { Injectable } from '@angular/core';
import {
  calculateInheritanceGift,
  InheritanceGiftParams,
  InheritanceGiftResult,
  TaxBracketRow,
} from '../calculators/inheritance-gift/inheritance-gift.calc';

export type { InheritanceGiftParams, InheritanceGiftResult, TaxBracketRow };

@Injectable({ providedIn: 'root' })
export class InheritanceGiftCalculatorService {
  calculate(params: InheritanceGiftParams): InheritanceGiftResult {
    return calculateInheritanceGift(params);
  }
}
