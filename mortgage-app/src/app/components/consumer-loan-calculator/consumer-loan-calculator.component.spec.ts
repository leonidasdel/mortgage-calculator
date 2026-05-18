import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ConsumerLoanCalculatorComponent } from './consumer-loan-calculator.component';
import { EuroPipe } from '../../pipes/euro.pipe';

describe('ConsumerLoanCalculatorComponent', () => {
  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      declarations: [ConsumerLoanCalculatorComponent, EuroPipe],
      imports: [CommonModule, ReactiveFormsModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  it('should report SEPPE as effective annual APR rather than nominal annual rate', () => {
    const fixture = TestBed.createComponent(ConsumerLoanCalculatorComponent);
    const component = fixture.componentInstance;

    component.form.patchValue({
      loanAmount: 10000,
      interestRate: 13,
      loanMonths: 48,
      loanFees: 0,
    });

    const summary = component.summary();
    const expectedEffectiveApr = (Math.pow(1 + summary.effectiveRate / 100 / 12, 12) - 1) * 100;

    expect(summary.seppe).toBeGreaterThan(summary.effectiveRate);
    expect(summary.seppe).toBeCloseTo(expectedEffectiveApr, 2);
  });
});
