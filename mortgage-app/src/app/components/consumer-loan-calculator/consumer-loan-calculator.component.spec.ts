import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ConsumerLoanCalculatorComponent } from './consumer-loan-calculator.component';

describe('ConsumerLoanCalculatorComponent', () => {
  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [ConsumerLoanCalculatorComponent],
      providers: [provideZonelessChangeDetection()],
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
