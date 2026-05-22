import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ConsumerLoanCalculatorComponent } from './consumer-loan-calculator.component';
import { roundEuro } from '../../utils/money.util';

describe('ConsumerLoanCalculatorComponent', () => {
  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [ConsumerLoanCalculatorComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('should compute exact monthly payment and SEPPE for default loan', () => {
    const fixture = TestBed.createComponent(ConsumerLoanCalculatorComponent);
    const component = fixture.componentInstance;

    component.formModel.set({
      loanAmount: 10000,
      interestRate: 13,
      loanMonths: 48,
      loanFees: 0,
    });

    const summary = component.summary();

    expect(roundEuro(summary.monthlyPayment)).toBe(271.26);
    expect(roundEuro(summary.seppe)).toBe(14.48);
    expect(summary.seppe).toBeGreaterThan(summary.effectiveRate);
  });
});
