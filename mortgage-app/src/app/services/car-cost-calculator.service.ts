import { Injectable } from '@angular/core';
import {
  calcAnnualFuelCost,
  calcFuelLitersPerYear,
  calculateCarCost,
  CarCostParams,
  CarCostResult,
} from '../calculators/car-cost/car-cost.calc';

export type { CarCostParams, CarCostResult };
export { calcAnnualFuelCost, calcFuelLitersPerYear };

@Injectable({ providedIn: 'root' })
export class CarCostCalculatorService {
  calculate(params: CarCostParams): CarCostResult {
    return calculateCarCost(params);
  }
}
