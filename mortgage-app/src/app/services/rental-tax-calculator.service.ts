import { Injectable } from '@angular/core';
import {
  calculateRentalTax,
  RentalTaxParams,
  RentalTaxResult,
  TaxBracketRow,
} from '../calculators/rental-tax/rental-tax.calc';

export type { RentalTaxParams, RentalTaxResult, TaxBracketRow };

@Injectable({ providedIn: 'root' })
export class RentalTaxCalculatorService {
  calculate(params: RentalTaxParams): RentalTaxResult {
    return calculateRentalTax(params);
  }
}
