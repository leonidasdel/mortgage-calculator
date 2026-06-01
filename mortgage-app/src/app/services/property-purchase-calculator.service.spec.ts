import { TestBed } from '@angular/core/testing';
import {
  calculatePropertyPurchase,
  firstHomeChildAllowance,
} from '../calculators/property-purchase/property-purchase.calc';
import { PropertyPurchaseCalculatorService } from './property-purchase-calculator.service';

describe('PropertyPurchaseCalculatorService', () => {
  let service: PropertyPurchaseCalculatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PropertyPurchaseCalculatorService);
  });

  it('should calculate total acquisition cost for default first-home purchase', () => {
    const result = service.calculate({
      purchasePrice: 200000,
      aaotValue: 200000,
      isFirstHome: true,
      isMarried: false,
      children: 0,
      includeAgent: true,
      includeLawyer: true,
    });

    expect(result.fma).toBe(0);
    expect(result.totalExtraCosts).toBe(9890);
    expect(result.totalAcquisitionCost).toBe(209890);
  });

  it('should add first-home child allowance per ΑΑΔΕ (+25k/+25k/+30k…)', () => {
    expect(firstHomeChildAllowance(0)).toBe(0);
    expect(firstHomeChildAllowance(2)).toBe(50_000);
    expect(firstHomeChildAllowance(3)).toBe(80_000);
  });

  it('should apply 3.09% FMA on value above married first-home threshold', () => {
    const result = calculatePropertyPurchase({
      purchasePrice: 300_000,
      aaotValue: 300_000,
      isFirstHome: true,
      isMarried: true,
      children: 0,
      includeAgent: false,
      includeLawyer: false,
    });

    expect(result.fhThreshold).toBe(250_000);
    expect(result.fmaTaxable).toBe(50_000);
    expect(result.fma).toBe(1545);
  });
});
