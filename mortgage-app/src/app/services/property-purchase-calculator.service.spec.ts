import { TestBed } from '@angular/core/testing';
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
});
