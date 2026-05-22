import { TestBed } from '@angular/core/testing';
import { UnusedLeaveCalculatorService } from './unused-leave-calculator.service';

describe('UnusedLeaveCalculatorService', () => {
  let service: UnusedLeaveCalculatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UnusedLeaveCalculatorService);
  });

  it('should calculate net compensation for 10 unused days at 1500 gross', () => {
    const result = service.calculate({
      salaryType: 'monthly',
      grossMonthly: 1500,
      workWeek: '5day',
      unusedDays: 10,
      includeHolidayBonus: false,
      situation: 'termination',
      taxYear: '2026',
      ageGroup: 'over30',
      children: 0,
      useCustomAnnualIncome: false,
    });

    expect(result.leaveCompensation).toBeCloseTo(600, 0);
    expect(result.totalNet).toBeCloseTo(468, 0);
  });
});
