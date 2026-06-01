import { TestBed } from '@angular/core/testing';
import { FreelancerCalculatorService } from './freelancer-calculator.service';

describe('FreelancerCalculatorService', () => {
  let service: FreelancerCalculatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FreelancerCalculatorService);
  });

  it('should compute net monthly for 60000 revenue (cat1, over30)', () => {
    const result = service.calculate({
      annualRevenue: 60_000,
      annualExpenses: 5000,
      efkaCategory: 'cat1',
      yearsActive: 'over3',
      ageGroup: 'over30',
      children: 0,
    });

    expect(result.netMonthly).toBe(2578.95);
    expect(result.annualEfka).toBe(3009.24);
  });

  it('should apply 27.5% advance tax when under 3 years active', () => {
    const over3 = service.calculate({
      annualRevenue: 40_000,
      annualExpenses: 0,
      efkaCategory: 'cat1',
      yearsActive: 'over3',
      ageGroup: 'over30',
      children: 0,
    });
    const under3 = service.calculate({
      annualRevenue: 40_000,
      annualExpenses: 0,
      efkaCategory: 'cat1',
      yearsActive: 'under3',
      ageGroup: 'over30',
      children: 0,
    });

    expect(under3.advanceTaxRate).toBeCloseTo(27.5, 5);
    expect(over3.advanceTaxRate).toBeCloseTo(55, 5);
    expect(under3.advanceTax).toBeLessThan(over3.advanceTax);
    expect(under3.netAnnual).toBeGreaterThan(over3.netAnnual);
  });

  it('should clamp negative revenue and expenses to zero', () => {
    const result = service.calculate({
      annualRevenue: -10_000,
      annualExpenses: -500,
      efkaCategory: 'cat1',
      yearsActive: 'over3',
      ageGroup: 'over30',
      children: 0,
    });

    expect(result.annualRevenue).toBe(0);
    expect(result.annualExpenses).toBe(0);
    expect(result.netAnnual).toBeLessThanOrEqual(0);
  });
});
