import { TestBed } from '@angular/core/testing';
import { SalaryCalculatorService } from './salary-calculator.service';

describe('HolidayBonusService (via SalaryCalculatorService)', () => {
  let service: SalaryCalculatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SalaryCalculatorService);
  });

  it('should calculate full-year holiday bonus net for gross 1500', () => {
    const result = service.calculateWithPartialBonuses({
      grossMonthly: 1500,
      year: 2026,
      ageGroup: 'over30',
      children: 0,
      partialEnabled: false,
      christmasMonthsWorked: 8,
      easterMonthsWorked: 4,
    });

    expect(result.totalGross).toBe(3093.74);
    expect(result.totalNet).toBe(2410.79);
  });
});
