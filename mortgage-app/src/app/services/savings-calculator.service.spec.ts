import { TestBed } from '@angular/core/testing';
import { SavingsCalculatorService } from './savings-calculator.service';
import { roundEuro } from '../utils/money.util';

describe('SavingsCalculatorService', () => {
  let service: SavingsCalculatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SavingsCalculatorService);
  });

  it('should compound initial deposit at 5% over 10 years with no tax or inflation', () => {
    const result = service.calculate({
      initialDeposit: 1000,
      monthlyContribution: 0,
      annualReturn: 5,
      durationYears: 10,
      applyTax: false,
      applyInflation: false,
    });

    expect(roundEuro(result.finalNominal)).toBe(1647.01);
    expect(roundEuro(result.netGains)).toBe(647.01);
  });
});
