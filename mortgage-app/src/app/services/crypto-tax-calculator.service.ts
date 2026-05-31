import { Injectable } from '@angular/core';
import {
  calculateCryptoTax,
  CryptoLot,
  CryptoTaxParams,
  CryptoTaxResult,
} from '../calculators/crypto-tax/crypto-tax.calc';

export type { CryptoLot, CryptoTaxParams, CryptoTaxResult };

@Injectable({ providedIn: 'root' })
export class CryptoTaxCalculatorService {
  calculate(params: CryptoTaxParams): CryptoTaxResult {
    return calculateCryptoTax(params);
  }
}
