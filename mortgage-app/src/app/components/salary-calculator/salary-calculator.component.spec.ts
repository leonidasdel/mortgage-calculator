import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SalaryCalculatorComponent } from './salary-calculator.component';
import { SalaryCalculatorService } from '../../services/salary-calculator.service';

describe('SalaryCalculatorComponent', () => {
  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [SalaryCalculatorComponent],
      providers: [provideZonelessChangeDetection(), SalaryCalculatorService],
    }).compileComponents();
  });

  it('should persist salary change month with the form state', () => {
    const fixture = TestBed.createComponent(SalaryCalculatorComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.toggleSalaryChange(true);
    component.onSalaryChangeMonthChange('7');

    const saved = JSON.parse(localStorage.getItem('salaryCalcState') ?? '{}');
    expect(saved.hasSalaryChange).toBe(true);
    expect(saved.salaryChangeMonth).toBe(7);
    expect(saved.inputs.hasSalaryChange).toBe(true);
    expect(saved.inputs.salaryChangeMonth).toBe(7);
  });

  it('should restore salary change month from local storage inputs', () => {
    localStorage.setItem(
      'salaryCalcState',
      JSON.stringify({
        inputs: {
          grossMonthly: 3100,
          netMonthly: 0,
          year: 2026,
          ageGroup: 'over30',
          children: 0,
          hasSalaryChange: true,
          salaryChangeMonth: '9',
          previousGross: 2850,
          ftePercent: 100,
          employer2Gross: 0,
          employer3Gross: 0,
        },
        annualBonus: 0,
        inputMode: 'gross',
      }),
    );

    const fixture = TestBed.createComponent(SalaryCalculatorComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.hasSalaryChange()).toBe(true);
    expect(component.salaryChangeMonth()).toBe(9);
    expect(component.formModel().salaryChangeMonth).toBe('9');
    expect(component.result().previousMonthly?.grossMonthly).toBe(2850);
  });

  it('should sync net input when gross changes via formModelWritable', () => {
    const fixture = TestBed.createComponent(SalaryCalculatorComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.store.formModelWritable.update((m) => ({ ...m, grossMonthly: 310 }));
    component.store.syncFromGross();
    TestBed.flushEffects();

    const netFor310 = component.store.formModelWritable().netMonthly;
    expect(netFor310).toBeGreaterThan(0);

    component.store.applyGrossInput(3100);
    TestBed.flushEffects();

    const net = component.store.formModelWritable().netMonthly;
    expect(net).toBe(component.result().netMonthly);
    expect(net).not.toBe(netFor310);
    expect(net).toBeGreaterThan(netFor310);
  });

  it('should sync net from gross input element value before form model commits', () => {
    const fixture = TestBed.createComponent(SalaryCalculatorComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const grossInput: HTMLInputElement = fixture.nativeElement.querySelector(
      '[data-testid="salary-input-grossMonthly"]',
    );
    grossInput.value = '310';
    grossInput.dispatchEvent(new Event('input'));
    component.onGrossChange({ target: grossInput } as unknown as Event);
    TestBed.flushEffects();

    const netFor310 = component.store.formModelWritable().netMonthly;

    grossInput.value = '3100';
    grossInput.dispatchEvent(new Event('input'));
    component.onGrossChange({ target: grossInput } as unknown as Event);
    TestBed.flushEffects();

    expect(component.store.formModelWritable().netMonthly).toBe(component.result().netMonthly);
    expect(component.store.formModelWritable().netMonthly).not.toBe(netFor310);
  });

  it('should sync net from fte input element value before form model commits', () => {
    const fixture = TestBed.createComponent(SalaryCalculatorComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.store.applyGrossInput(3100);
    TestBed.flushEffects();

    const fteInput: HTMLInputElement = fixture.nativeElement.querySelector(
      '[data-testid="salary-input-ftePercent"]',
    );
    fteInput.value = '50';
    fteInput.dispatchEvent(new Event('input'));
    component.onParamChange({ target: fteInput } as unknown as Event);
    TestBed.flushEffects();

    expect(component.store.formModelWritable().ftePercent).toBe(50);
    expect(component.result().netMonthly).toBe(component.store.formModelWritable().netMonthly);
    expect(component.fullTimeResult()).not.toBeNull();
  });
});
