import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MortgageCalculatorComponent } from './mortgage-calculator.component';
import { MortgageCalculatorService } from '../../services/mortgage-calculator.service';
import { PersistenceService } from '../../services/persistence.service';
import { ExportService } from '../../services/export.service';
import { EuroPipe } from '../../pipes/euro.pipe';
import { DateDDMMYYYYPipe } from '../../pipes/date-ddmmyyyy.pipe';

describe('MortgageCalculatorComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MortgageCalculatorComponent, EuroPipe, DateDDMMYYYYPipe],
      imports: [ReactiveFormsModule],
      providers: [MortgageCalculatorService, PersistenceService, ExportService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(MortgageCalculatorComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should initialise loanForm with default values', () => {
    const fixture = TestBed.createComponent(MortgageCalculatorComponent);
    const component = fixture.componentInstance;
    expect(component.loanForm.get('loanAmount')?.value).toBe(100000);
    expect(component.loanForm.get('erMode')?.value).toBe('reducePmt');
  });
});
