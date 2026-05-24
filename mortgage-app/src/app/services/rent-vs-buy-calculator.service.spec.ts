import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { RentVsBuyCalculatorService } from './rent-vs-buy-calculator.service';
import { MortgageCalculatorService } from './mortgage-calculator.service';

describe('RentVsBuyCalculatorService', () => {
  let service: RentVsBuyCalculatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), RentVsBuyCalculatorService, MortgageCalculatorService],
    });
    service = TestBed.inject(RentVsBuyCalculatorService);
  });

  it('computes down payment from percentage', () => {
    const result = service.calculate(
      { propertyPrice: 200000, downPaymentPct: 20, closingCostsPct: 3, mortgageRate: 3.5, mortgageTerm: 30, monthlyRent: 800 },
      10,
    );
    expect(result.downPayment).toBe(40000);
    expect(result.closingCosts).toBe(6000);
    expect(result.loanAmount).toBe(160000);
  });
});
