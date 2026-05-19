import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { SalaryCalculatorComponent } from './salary-calculator.component';
import { SalaryCalculatorService } from '../../services/salary-calculator.service';
import { EuroPipe } from '../../pipes/euro.pipe';

describe('SalaryCalculatorComponent', () => {
  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      declarations: [SalaryCalculatorComponent, EuroPipe],
      imports: [CommonModule, ReactiveFormsModule],
      providers: [SalaryCalculatorService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  it('should persist salary change month with the form state', () => {
    const fixture = TestBed.createComponent(SalaryCalculatorComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.toggleSalaryChange(true);
    component.onSalaryChangeMonthChange('7');

    const saved = JSON.parse(localStorage.getItem('salaryCalcState') ?? '{}');
    expect(saved.hasSalaryChange).toBe(true);
    expect(saved.salaryChangeMonth).toBe(7);
    expect(saved.inputs.hasSalaryChange).toBe(true);
    expect(saved.inputs.salaryChangeMonth).toBe(7);
  });

  it('should restore salary change month from local storage inputs', () => {
    localStorage.setItem('salaryCalcState', JSON.stringify({
      inputs: {
        grossMonthly: 3100,
        netMonthly: 0,
        year: 2026,
        ageGroup: 'over30',
        children: 0,
        hasSalaryChange: true,
        salaryChangeMonth: 9,
        previousGross: 2850,
      },
      annualBonus: 0,
      inputMode: 'gross',
    }));

    const fixture = TestBed.createComponent(SalaryCalculatorComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.hasSalaryChange()).toBe(true);
    expect(component.salaryChangeMonth()).toBe(9);
    expect(component.salaryForm.get('salaryChangeMonth')?.value).toBe(9);
    expect(component.result().previousMonthly?.grossMonthly).toBe(2850);
  });
});
