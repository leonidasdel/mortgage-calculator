import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SeveranceCalculatorComponent } from './severance-calculator.component';

describe('SeveranceCalculatorComponent', () => {
  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [SeveranceCalculatorComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('should not tax severance at or below the tax-free threshold', () => {
    const fixture = TestBed.createComponent(SeveranceCalculatorComponent);
    const component = fixture.componentInstance;

    component.formModel.set({
      grossMonthly: 2000,
      yearsOfService: 10,
      monthsExtra: 0,
      terminationType: 'without_notice',
    });

    const result = component.result();

    expect(result.grossSeverance).toBe(13999.98);
    expect(result.severanceTax).toBe(0);
    expect(result.netSeverance).toBe(result.grossSeverance);
  });

  it('should tax severance progressively above 60000 euros', () => {
    const fixture = TestBed.createComponent(SeveranceCalculatorComponent);
    const component = fixture.componentInstance;

    component.formModel.set({
      grossMonthly: 10000,
      yearsOfService: 20,
      monthsExtra: 0,
      terminationType: 'without_notice',
    });

    const result = component.result();

    expect(result.grossSeverance).toBe(186666.72);
    expect(result.severanceTax).toBe(25000.02);
    expect(result.netSeverance).toBe(161666.7);
  });
});
