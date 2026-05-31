import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RentVsBuyCalculatorComponent } from './rent-vs-buy-calculator.component';

describe('RentVsBuyCalculatorComponent', () => {
  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [RentVsBuyCalculatorComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('should calculate down payment and closing costs from explicit amounts', () => {
    const fixture = TestBed.createComponent(RentVsBuyCalculatorComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.store.formModelWritable.update((m) => ({ ...m, propertyPrice: 198000 }));
    component.onDownPaymentModeChange('amount');
    component.store.formModelWritable.update((m) => ({ ...m, downPaymentAmount: 17820 }));
    component.onClosingCostsModeChange('amount');
    component.store.formModelWritable.update((m) => ({ ...m, closingCostsAmount: 11880 }));
    TestBed.flushEffects();

    const result = component.result();
    expect(result.downPayment).toBe(17820);
    expect(result.downPaymentPct).toBeCloseTo(9, 2);
    expect(result.closingCosts).toBe(11880);
    expect(result.closingCostsPct).toBeCloseTo(6, 2);
  });

  it('should persist and restore amount modes and values', () => {
    const fixture = TestBed.createComponent(RentVsBuyCalculatorComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.store.formModelWritable.update((m) => ({ ...m, propertyPrice: 198000 }));
    component.onDownPaymentModeChange('amount');
    component.store.formModelWritable.update((m) => ({ ...m, downPaymentAmount: 17820 }));
    component.onClosingCostsModeChange('amount');
    component.store.formModelWritable.update((m) => ({ ...m, closingCostsAmount: 11880 }));
    TestBed.flushEffects();

    const saved = JSON.parse(localStorage.getItem('rentVsBuyCalcState') ?? '{}');
    expect(saved.downPaymentMode).toBe('amount');
    expect(saved.downPaymentAmount).toBe(17820);
    expect(saved.downPaymentPct).toBe(9);
    expect(saved.closingCostsMode).toBe('amount');
    expect(saved.closingCostsAmount).toBe(11880);
    expect(saved.closingCostsPct).toBe(6);

    const restoredFixture = TestBed.createComponent(RentVsBuyCalculatorComponent);
    const restored = restoredFixture.componentInstance;
    restoredFixture.detectChanges();

    expect(restored.formModel().downPaymentMode).toBe('amount');
    expect(restored.formModel().downPaymentAmount).toBe(17820);
    expect(restored.result().downPayment).toBe(17820);
    expect(restored.formModel().closingCostsMode).toBe('amount');
    expect(restored.formModel().closingCostsAmount).toBe(11880);
    expect(restored.result().closingCosts).toBe(11880);
  });
});
