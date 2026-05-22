import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AnnualBonusCalculatorComponent } from './annual-bonus-calculator.component';
import { SalaryCalculatorService } from '../../services/salary-calculator.service';

describe('AnnualBonusCalculatorComponent', () => {
  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [AnnualBonusCalculatorComponent],
      providers: [provideZonelessChangeDetection(), SalaryCalculatorService],
    }).compileComponents();
  });

  it('should create the component with default values', () => {
    const fixture = TestBed.createComponent(AnnualBonusCalculatorComponent);
    const component = fixture.componentInstance;

    expect(component).toBeTruthy();
    expect(component.form.get('grossMonthly')?.value).toBe(1500);
    expect(component.form.get('annualBonus')?.value).toBe(1000);
  });

  it('should pass salary change details into the salary calculation', () => {
    const fixture = TestBed.createComponent(AnnualBonusCalculatorComponent);
    const component = fixture.componentInstance;
    const service = TestBed.inject(SalaryCalculatorService);
    const calculateSpy = vi.spyOn(service, 'calculate');

    component.form.patchValue({
      grossMonthly: 2200,
      annualBonus: 1000,
      hasSalaryChange: true,
      previousGross: 1800,
      salaryChangeMonth: 7,
    });

    component.result();

    expect(calculateSpy).toHaveBeenCalledWith(expect.objectContaining({
      grossMonthly: 2200,
      annualBonus: 1000,
      salaryChange: {
        previousGross: 1800,
        effectiveMonth: 7,
      },
    }));
  });

  it('should show zeroed bonus values when annual bonus is zero', () => {
    const fixture = TestBed.createComponent(AnnualBonusCalculatorComponent);
    const component = fixture.componentInstance;

    component.form.patchValue({ annualBonus: 0 });

    expect(component.bonus()).toEqual({
      grossBonus: 0,
      efkaEmployee: 0,
      efkaEmployer: 0,
      tax: 0,
      net: 0,
    });
  });
});
