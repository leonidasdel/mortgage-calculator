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
    expect(result.baseSalaryCalculation).toBe(1750);
    expect(result.grossSeverance).toBe(5250);
    expect(result.severanceTax).toBe(0);
    expect(result.netSeverance).toBe(5250);
  });

  it('should calculate tax-free severance for 10 years at 2000 gross', () => {
    const result = service.calculate({
      grossMonthly: 2000,
      yearsOfService: 10,
      monthsExtra: 0,
      terminationType: 'without_notice',
    });

    expect(result.grossSeverance).toBe(13999.98);
    expect(result.severanceTax).toBe(0);
    expect(result.netSeverance).toBe(13999.98);
  });
});
