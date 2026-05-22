import { TestBed } from '@angular/core/testing';
import { SalaryCalculatorService } from './salary-calculator.service';
import { SalaryParams } from '../models/salary.models';
import { MAX_INSURABLE_EARNINGS } from '../constants/payroll.constants';
import { BASE_TAX_DISCOUNTS } from '../constants/tax-brackets.constants';

describe('SalaryCalculatorService', () => {
  let service: SalaryCalculatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SalaryCalculatorService);
  });

  it('should return annual bonus details when annual bonus is provided', () => {
    const result = service.calculate(baseParams({ annualBonus: 1000 }));

    expect(result.bonusResult).toBeTruthy();
    expect(result.bonusResult?.grossBonus).toBe(1000);
    expect(result.bonusResult?.net).toBeGreaterThan(0);
  });

  it('should insure a bonus below the cap as a separate payment', () => {
    const result = service.calculate(baseParams({
      grossMonthly: 7000,
      annualBonus: 1000,
    }));

    expect(result.bonusResult?.efkaEmployee).toBe(133.7);
  });

  it('should cap EFKA contributions at MAX_INSURABLE_EARNINGS', () => {
    const result = service.calculate(baseParams({ grossMonthly: 10000 }));

    expect(result.efkaEmployee).toBeCloseTo(
      +(MAX_INSURABLE_EARNINGS * 0.1337).toFixed(2),
      2,
    );
  });

  it('should reverse-calculate gross from target net monthly', () => {
    const params = baseParams({ grossMonthly: 2000 });
    const forward = service.calculate(params);
    const gross = service.reverseCalculate(forward.netMonthly, {
      annualBonus: params.annualBonus,
      year: params.year,
      ageGroup: params.ageGroup,
      children: params.children,
    });

    expect(gross).toBeCloseTo(2000, 1);
    expect(service.calculate({ ...params, grossMonthly: gross }).netMonthly)
      .toBeCloseTo(forward.netMonthly, 1);
  });

  it('should apply children discount in calculateTaxOnly', () => {
    const taxableIncome = 10000;
    const withChildren = service.calculateTaxOnly(taxableIncome, 2026, 'over30', 2);
    const withoutChildren = service.calculateTaxOnly(taxableIncome, 2026, 'over30', 0);

    expect(withChildren.taxDiscount).toBe(BASE_TAX_DISCOUNTS[2]);
    expect(withChildren.annualTax).toBeLessThan(withoutChildren.annualTax);
  });

  it('should use the 14-month model for annual net totals', () => {
    const grossMonthly = 1500;
    const result = service.calculate(baseParams({ grossMonthly }));

    expect(result.taxableIncome).toBeCloseTo(grossMonthly * 14 - result.efkaEmployee * 14, 0);
    expect(result.incomeTax * 14).toBeCloseTo(result.annualTax, 0);
    expect(result.annualNetBase).toBeCloseTo(
      result.annualGrossBase - result.annualEfka - result.annualTax,
      2,
    );
  });

  it('should build salary params from form slice', () => {
    const params = service.buildSalaryParams({
      grossMonthly: 2000,
      year: 2026,
      ageGroup: 'over30',
      children: 1,
      annualBonus: 500,
      hasSalaryChange: true,
      salaryChangeMonth: 6,
      previousGross: 1800,
    });

    expect(params.grossMonthly).toBe(2000);
    expect(params.annualBonus).toBe(500);
    expect(params.salaryChange?.effectiveMonth).toBe(6);
    expect(params.salaryChange?.previousGross).toBe(1800);
  });

  it('should scale holiday bonuses with partial employment factors', () => {
    const full = service.calculateWithPartialBonuses({
      grossMonthly: 1500,
      year: 2026,
      ageGroup: 'over30',
      children: 0,
      partialEnabled: false,
      christmasMonthsWorked: 8,
      easterMonthsWorked: 4,
    });
    const partial = service.calculateWithPartialBonuses({
      grossMonthly: 1500,
      year: 2026,
      ageGroup: 'over30',
      children: 0,
      partialEnabled: true,
      christmasMonthsWorked: 4,
      easterMonthsWorked: 2,
    });

    expect(full.christmasFactor).toBe(1);
    expect(partial.christmasFactor).toBe(0.5);
    expect(partial.totalNet).toBeLessThan(full.totalNet);
  });
});

function baseParams(overrides: Partial<SalaryParams> = {}): SalaryParams {
  return {
    grossMonthly: 1500,
    annualBonus: 0,
    year: 2026,
    ageGroup: 'over30',
    children: 0,
    ...overrides,
  };
}
