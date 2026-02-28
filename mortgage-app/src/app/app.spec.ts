import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { App } from './app';
import { MortgageCalculatorService } from './services/mortgage-calculator.service';
import { PersistenceService } from './services/persistence.service';
import { ExportService } from './services/export.service';
import { EuroPipe } from './pipes/euro.pipe';
import { DateDDMMYYYYPipe } from './pipes/date-ddmmyyyy.pipe';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [App, EuroPipe, DateDDMMYYYYPipe],
      imports: [ReactiveFormsModule],
      providers: [MortgageCalculatorService, PersistenceService, ExportService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should initialise loanForm with default values', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app.loanForm.get('loanAmount')?.value).toBe(100000);
    expect(app.loanForm.get('erMode')?.value).toBe('reducePmt');
  });
});
