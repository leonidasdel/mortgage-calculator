import { Component, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { EarlyRepayment, LoanParams } from '../../models/mortgage.models';
import { MortgageCalculatorService } from '../../services/mortgage-calculator.service';
import { PersistenceService } from '../../services/persistence.service';
import { ExportService } from '../../services/export.service';

@Component({
  selector: 'app-mortgage-calculator',
  standalone: false,
  templateUrl: './mortgage-calculator.component.html',
  styleUrl: './mortgage-calculator.component.scss',
})
export class MortgageCalculatorComponent implements OnInit {

  loanForm: FormGroup;
  erList = signal<EarlyRepayment[]>([]);

  private formValues;

  constructor(
    private fb: FormBuilder,
    private calc: MortgageCalculatorService,
    private persistence: PersistenceService,
    private exportSvc: ExportService,
  ) {
    this.loanForm = this.fb.group({
      loanAmount:  [100000],
      loanYears:   [30],
      fixedYears:  [5],
      fixedRate:   [2.9],
      euribor:     [2.464],
      bankMargin:  [2.1],
      gracePeriod: [0],
      erMode:      ['reducePmt'],
    });

    this.formValues = toSignal(this.loanForm.valueChanges, { initialValue: this.loanForm.value });
  }

  ngOnInit(): void {
    const saved = this.persistence.loadState();
    if (saved) {
      if (saved.inputs) this.loanForm.patchValue(saved.inputs);
      if (Array.isArray(saved.erList)) this.erList.set(saved.erList);
    }

    this.loanForm.valueChanges.subscribe(() => this.persist());
  }

  private get currentParams(): LoanParams {
    return this.loanForm.value as LoanParams;
  }

  schedule = computed(() => {
    this.formValues();
    return this.calc.buildSchedule(this.currentParams, this.erList());
  });

  baseSchedule = computed(() => {
    this.formValues();
    return this.calc.buildSchedule(this.currentParams, []);
  });

  summary = computed(() =>
    this.calc.computeSummary(this.schedule(), this.baseSchedule(), this.currentParams)
  );

  erMonthsSaved = computed(() =>
    this.calc.computeErMonthsSaved(this.currentParams, this.erList())
  );

  onErListChange(updated: EarlyRepayment[]): void {
    this.erList.set(updated);
    this.persist();
  }

  onErModeChange(mode: 'reducePmt' | 'reduceDur'): void {
    this.loanForm.patchValue({ erMode: mode });
    this.persist();
  }

  onExportCsv(): void {
    this.exportSvc.exportCSV(this.schedule());
  }

  private persist(): void {
    this.persistence.saveState(this.loanForm.value, this.erList(), 0);
  }
}
