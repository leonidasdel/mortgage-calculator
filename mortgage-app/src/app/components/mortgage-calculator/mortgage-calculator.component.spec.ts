import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MortgageCalculatorComponent } from './mortgage-calculator.component';
import { MortgageCalculatorService } from '../../services/mortgage-calculator.service';
import { PersistenceService } from '../../services/persistence.service';
import { ExportService } from '../../services/export.service';

describe('MortgageCalculatorComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MortgageCalculatorComponent],
      providers: [
        provideZonelessChangeDetection(),
        MortgageCalculatorService,
        PersistenceService,
        ExportService,
      ],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(MortgageCalculatorComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should initialise loanForm with default values', () => {
    const fixture = TestBed.createComponent(MortgageCalculatorComponent);
    const component = fixture.componentInstance;
    expect(component.loanForm.get('loanAmount')?.value).toBe(100000);
    expect(component.loanForm.get('erMode')?.value).toBe('reducePmt');
  });
});
