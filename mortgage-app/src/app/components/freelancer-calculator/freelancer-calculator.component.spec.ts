import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FreelancerCalculatorComponent } from './freelancer-calculator.component';

describe('FreelancerCalculatorComponent', () => {
  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [FreelancerCalculatorComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('should subtract business expenses from net annual and monthly income', () => {
    const fixture = TestBed.createComponent(FreelancerCalculatorComponent);
    const component = fixture.componentInstance;

    component.formModel.set({
      annualRevenue: 30000,
      annualExpenses: 5000,
      efkaCategory: 'cat1',
      yearsActive: 'over3',
      ageGroup: 'over30',
      children: '0',
    });

    const result = component.result();

    expect(result.netAnnual).toBe(
      result.annualRevenue - result.annualExpenses - result.totalObligations,
    );
    expect(result.netMonthly).toBe(result.netAnnual / 12);
  });

  it('should compute exact net monthly for 60000 revenue', () => {
    const fixture = TestBed.createComponent(FreelancerCalculatorComponent);
    const component = fixture.componentInstance;

    component.formModel.set({
      annualRevenue: 60_000,
      annualExpenses: 5000,
      efkaCategory: 'cat1',
      yearsActive: 'over3',
      ageGroup: 'over30',
      children: '0',
    });

    expect(component.result().netMonthly).toBe(2574.99);
  });
});
