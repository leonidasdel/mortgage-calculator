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

  it('LoanFormHarness reads loan amount', async () => {
    const fixture = TestBed.createComponent(MortgageCalculatorComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, LoanFormHarness);
    const amount = await harness.getLoanAmount();
    expect(Number(amount)).toBe(100000);
  });
});
