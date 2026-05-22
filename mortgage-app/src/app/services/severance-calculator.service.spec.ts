import { TestBed } from '@angular/core/testing';
import { SeveranceCalculatorService } from './severance-calculator.service';

describe('SeveranceCalculatorService', () => {
  let service: SeveranceCalculatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SeveranceCalculatorService);
  });

  it('should award 3 months severance for 5 years without notice', () => {
    const result = service.calculate({
      grossMonthly: 1500,
      yearsOfService: 5,
      monthsExtra: 0,
      terminationType: 'without_notice',
    });

    expect(result.completedYears).toBe(5);
    expect(result.fullSeveranceMonths).toBe(3);
    expect(result.actualMonths).toBe(3);
    expect(result.baseSalaryCalculation).toBeCloseTo(1750, 2);
    expect(result.grossSeverance).toBeCloseTo(5250, 2);
  });

  it('should apply 0% tax bracket for severance under 60k', () => {
    const result = service.calculate({
      grossMonthly: 1500,
      yearsOfService: 5,
      monthsExtra: 0,
      terminationType: 'without_notice',
    });

    expect(result.grossSeverance).toBeLessThan(60000);
    expect(result.severanceTax).toBe(0);
    expect(result.netSeverance).toBe(result.grossSeverance);
  });
});
