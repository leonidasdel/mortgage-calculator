import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MortgageCalculatorComponent } from './mortgage-calculator.component';
import { MortgageCalculatorService } from '../../services/mortgage-calculator.service';
import { PersistenceService } from '../../services/persistence.service';
import { ExportService } from '../../services/export.service';
import { RateFeedService } from '../../services/rate-feed.service';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { LoanFormHarness } from '../../testing/harnesses/loan-form.harness';

describe('MortgageCalculatorComponent', () => {
  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [MortgageCalculatorComponent],
      providers: [
        provideZonelessChangeDetection(),
        MortgageCalculatorService,
        PersistenceService,
        ExportService,
        RateFeedService,
      ],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(MortgageCalculatorComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should initialise formModel with default values', () => {
    const fixture = TestBed.createComponent(MortgageCalculatorComponent);
    const component = fixture.componentInstance;
    expect(component.formModel().loanAmount).toBe(100000);
    expect(component.formModel().erMode).toBe('reducePmt');
  });

  it('should restore loan inputs into formModelWritable from localStorage', () => {
    localStorage.setItem(
      'mortgageCalcState',
      JSON.stringify({
        inputs: { loanAmount: 250000, loanYears: 25 },
        erList: [],
        erCounter: 0,
      }),
    );

    const fixture = TestBed.createComponent(MortgageCalculatorComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.formModel().loanAmount).toBe(250000);
    expect(component.formModel().loanYears).toBe(25);
    expect(component.store.formModelWritable().loanAmount).toBe(250000);
    expect(component.store.formModelWritable().loanYears).toBe(25);
  });

  it('should update erMode via formModelWritable', () => {
    const fixture = TestBed.createComponent(MortgageCalculatorComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.onErModeChange('reduceDur');
    expect(component.formModel().erMode).toBe('reduceDur');
    expect(component.store.formModelWritable().erMode).toBe('reduceDur');
  });

  it('LoanFormHarness reads loan amount', async () => {
    const fixture = TestBed.createComponent(MortgageCalculatorComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, LoanFormHarness);
    const amount = await harness.getLoanAmount();
    expect(Number(amount)).toBe(100000);
  });
});
