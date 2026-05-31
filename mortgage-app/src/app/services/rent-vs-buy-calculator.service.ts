import { Injectable } from '@angular/core';
import {
  calculateRentVsBuy,
  RentVsBuyParams,
  RentVsBuyResult,
  YearlyRow,
} from '../calculators/rent-vs-buy/rent-vs-buy.calc';

export type { RentVsBuyParams, RentVsBuyResult, YearlyRow };

@Injectable({ providedIn: 'root' })
export class RentVsBuyCalculatorService {
  calculate(params: RentVsBuyParams, timeHorizon: number): RentVsBuyResult {
    return calculateRentVsBuy(params, timeHorizon);
  }
}
