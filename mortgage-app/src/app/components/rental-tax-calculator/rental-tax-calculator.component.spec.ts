import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RentalTaxCalculatorComponent } from './rental-tax-calculator.component';
import { EuroPipe } from '../../pipes/euro.pipe';

describe('RentalTaxCalculatorComponent', () => {
  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      declarations: [RentalTaxCalculatorComponent, EuroPipe],
      imports: [CommonModule, ReactiveFormsModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  it('should calculate annual rental income from monthly input', () => {
    const fixture = TestBed.createComponent(RentalTaxCalculatorComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.onIncomeModeChange('monthly');
    component.form.patchValue({ monthlyIncome: 900 });
    component.onMonthlyIncomeInput();

    expect(component.form.get('annualIncome')?.value).toBe(10800);
    expect(component.result().annualIncome).toBe(10800);
  });

  it('should persist and restore monthly income mode', () => {
    const fixture = TestBed.createComponent(RentalTaxCalculatorComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.onIncomeModeChange('monthly');
    component.form.patchValue({ monthlyIncome: 950 });
    component.onMonthlyIncomeInput();

    const saved = JSON.parse(localStorage.getItem('rentalTaxCalcState') ?? '{}');
    expect(saved.incomeMode).toBe('monthly');
    expect(saved.monthlyIncome).toBe(950);
    expect(saved.annualIncome).toBe(11400);

    const restoredFixture = TestBed.createComponent(RentalTaxCalculatorComponent);
    const restored = restoredFixture.componentInstance;
    restoredFixture.detectChanges();

    expect(restored.form.get('incomeMode')?.value).toBe('monthly');
    expect(restored.form.get('monthlyIncome')?.value).toBe(950);
    expect(restored.result().annualIncome).toBe(11400);
  });
});
