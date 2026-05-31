import { Injectable } from '@angular/core';
import {
  calculatePropertyPurchase,
  CostItem,
  PropertyPurchaseParams,
  PropertyPurchaseResult,
} from '../calculators/property-purchase/property-purchase.calc';

export type { CostItem, PropertyPurchaseParams, PropertyPurchaseResult };

@Injectable({ providedIn: 'root' })
export class PropertyPurchaseCalculatorService {
  calculate(params: PropertyPurchaseParams): PropertyPurchaseResult {
    return calculatePropertyPurchase(params);
  }
}
