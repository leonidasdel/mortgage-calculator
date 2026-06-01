import { TestBed } from '@angular/core/testing';
import { RentalTaxCalculatorService } from './rental-tax-calculator.service';

describe('RentalTaxCalculatorService', () => {
  let service: RentalTaxCalculatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RentalTaxCalculatorService);
  });

  it('should derive annual income from monthly rent', () => {
    const result = service.calculate({
      incomeMode: 'monthly',
      annualIncome: 0,
      monthlyIncome: 900,
      expenseMethod: 'automatic',
      actualExpenses: 0,
    });

    expect(result.annualIncome).toBe(10800);
  });

  it('should apply 5% automatic expense deduction and 15% first bracket tax', () => {
    const result = service.calculate({
      incomeMode: 'annual',
      annualIncome: 10800,
      monthlyIncome: 0,
      expenseMethod: 'automatic',
      actualExpenses: 0,
      taxYear: 2026,
    });

    expect(result.expensesDeduction).toBe(540);
    expect(result.taxableIncome).toBe(10260);
    expect(result.totalTax).toBe(1539);
    expect(result.netAnnual).toBe(9261);
    expect(result.netMonthly).toBe(771.75);
    expect(result.effectiveRate).toBe(15);
  });

  it('should cap actual expenses at annual income', () => {
    const result = service.calculate({
      incomeMode: 'annual',
      annualIncome: 10_000,
      monthlyIncome: 0,
      expenseMethod: 'actual',
      actualExpenses: 50_000,
    });

    expect(result.expensesDeduction).toBe(10000);
    expect(result.taxableIncome).toBe(0);
    expect(result.totalTax).toBe(0);
    expect(result.netAnnual).toBe(10000);
  });

  it('should apply 2026 progressive brackets for higher rental income', () => {
    const result = service.calculate({
      incomeMode: 'annual',
      annualIncome: 40_000,
      monthlyIncome: 0,
      expenseMethod: 'automatic',
      actualExpenses: 0,
      taxYear: 2026,
    });

    expect(result.expensesDeduction).toBe(2000);
    expect(result.taxableIncome).toBe(38000);
    expect(result.totalTax).toBe(9900);
    expect(result.netAnnual).toBe(30100);
  });

  it('should apply 2025 brackets when tax year is 2025', () => {
    const result = service.calculate({
      incomeMode: 'annual',
      annualIncome: 40_000,
      monthlyIncome: 0,
      expenseMethod: 'automatic',
      actualExpenses: 0,
      taxYear: 2025,
    });

    expect(result.totalTax).toBe(11200);
    expect(result.netAnnual).toBe(28800);
  });
});
