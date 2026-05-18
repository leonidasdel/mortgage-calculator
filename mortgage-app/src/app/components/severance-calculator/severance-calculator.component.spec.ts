import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { SeveranceCalculatorComponent } from './severance-calculator.component';
import { EuroPipe } from '../../pipes/euro.pipe';

describe('SeveranceCalculatorComponent', () => {
  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      declarations: [SeveranceCalculatorComponent, EuroPipe],
      imports: [CommonModule, ReactiveFormsModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  it('should not tax severance at or below the tax-free threshold', () => {
    const fixture = TestBed.createComponent(SeveranceCalculatorComponent);
    const component = fixture.componentInstance;

    component.form.patchValue({
      grossMonthly: 2000,
      yearsOfService: 10,
      terminationType: 'without_notice',
    });

    const result = component.result();

    expect(result.grossSeverance).toBe(10000);
    expect(result.severanceTax).toBe(0);
    expect(result.netSeverance).toBe(result.grossSeverance);
  });

  it('should tax severance progressively above 60000 euros', () => {
    const fixture = TestBed.createComponent(SeveranceCalculatorComponent);
    const component = fixture.componentInstance;

    component.form.patchValue({
      grossMonthly: 10000,
      yearsOfService: 20,
      terminationType: 'without_notice',
    });

    const result = component.result();

    expect(result.grossSeverance).toBe(150000);
    expect(result.severanceTax).toBe(14000);
    expect(result.netSeverance).toBe(136000);
  });
});
