import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { FreelancerCalculatorComponent } from './freelancer-calculator.component';
import { EuroPipe } from '../../pipes/euro.pipe';

describe('FreelancerCalculatorComponent', () => {
  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      declarations: [FreelancerCalculatorComponent, EuroPipe],
      imports: [CommonModule, ReactiveFormsModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  it('should subtract business expenses from net annual and monthly income', () => {
    const fixture = TestBed.createComponent(FreelancerCalculatorComponent);
    const component = fixture.componentInstance;

    component.form.patchValue({
      annualRevenue: 30000,
      annualExpenses: 5000,
      efkaCategory: 'cat1',
      yearsActive: 'over3',
      ageGroup: 'over30',
      children: 0,
    });

    const result = component.result();

    expect(result.netAnnual).toBeCloseTo(
      result.annualRevenue - result.annualExpenses - result.totalObligations,
      2,
    );
    expect(result.netMonthly).toBeCloseTo(result.netAnnual / 12, 2);
  });
});
