import { TestBed } from '@angular/core/testing';
import { SalaryCalculatorService } from './salary-calculator.service';
import { SalaryParams } from '../models/salary.models';

describe('SalaryCalculatorService', () => {
  let service: SalaryCalculatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SalaryCalculatorService);
  });

  it('should return annual bonus details when annual bonus is provided', () => {
    const result = service.calculate(baseParams({ annualBonus: 1000 }));

    expect(result.bonusResult).toBeTruthy();
    expect(result.bonusResult?.grossBonus).toBe(1000);
    expect(result.bonusResult?.net).toBeGreaterThan(0);
  });

  it('should insure a bonus below the cap as a separate payment', () => {
    const result = service.calculate(baseParams({
      grossMonthly: 7000,
      annualBonus: 1000,
    }));

    expect(result.bonusResult?.efkaEmployee).toBe(133.7);
  });
});

function baseParams(overrides: Partial<SalaryParams> = {}): SalaryParams {
  return {
    grossMonthly: 1500,
    annualBonus: 0,
    year: 2026,
    ageGroup: 'over30',
    children: 0,
    ...overrides,
  };
}
