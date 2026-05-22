import { TestBed } from '@angular/core/testing';
import { InterestCalculatorService } from './interest-calculator.service';

describe('InterestCalculatorService', () => {
  let service: InterestCalculatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InterestCalculatorService);
  });

  it('should calculate gross interest over 365 days using daily rate', () => {
    const result = service.calculate({
      capital: 10000,
      rate: 3.5,
      startDate: '2025-01-01',
      endDate: '2026-01-01',
    });

    expect(result.days).toBe(365);
    expect(result.grossInterest).toBe(350);
  });

  it('should withhold 15% tax on gross interest', () => {
    const result = service.calculate({
      capital: 10000,
      rate: 3.5,
      startDate: '2025-01-01',
      endDate: '2026-01-01',
    });

    expect(result.taxRate).toBe(15);
    expect(result.tax).toBe(52.5);
    expect(result.netInterest).toBe(297.5);
    expect(result.totalAmount).toBe(10297.5);
  });
});
