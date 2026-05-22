import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { EarlyRepayment, LoanParams } from '../../models/mortgage.models';
import { MortgageCalculatorService } from '../../services/mortgage-calculator.service';
import { PersistenceService } from '../../services/persistence.service';
import { ExportService } from '../../services/export.service';

import { EuroPipe } from '../../pipes/euro.pipe';
import { AmortizationChartComponent } from '../amortization-chart/amortization-chart.component';
import { AmortizationTableComponent } from '../amortization-table/amortization-table.component';
import { CalcExplanationComponent } from '../calc-explanation/calc-explanation.component';
import { EarlyRepaymentsComponent } from '../early-repayments/early-repayments.component';
import { ExportRowComponent } from '../export-row/export-row.component';
import { LawFooterComponent } from '../law-footer/law-footer.component';
import { LoanFormComponent } from '../loan-form/loan-form.component';
import { SummaryPanelComponent } from '../summary-panel/summary-panel.component';
@Component({
  selector: 'app-mortgage-calculator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EuroPipe, AmortizationChartComponent, AmortizationTableComponent, CalcExplanationComponent, EarlyRepaymentsComponent, ExportRowComponent, LawFooterComponent, LoanFormComponent, SummaryPanelComponent],
  templateUrl: './mortgage-calculator.component.html',
  styleUrl: './mortgage-calculator.component.scss',
})
export class MortgageCalculatorComponent implements OnInit {

  loanForm: FormGroup;
  erList = signal<EarlyRepayment[]>([]);
  private destroyRef = inject(DestroyRef);

  private formValues;

  readonly explanationSteps = [
    'Η δόση υπολογίζεται με τύπο PMT για σταθερή και κυμαινόμενη περίοδο.',
    'Προστίθεται εισφορά Ν.128/1975 0,12% επί του ανεξόφλητου κεφαλαίου.',
    'Κυμαινόμενο επιτόκιο = Euribor + περιθώριο τράπεζας.',
    'Οι πρόωρες αποπληρωμές μειώνουν δόση ή διάρκεια.',
  ];

  readonly explanationFormula =
    'Δόση = PMT(κεφάλαιο, επιτόκιο + 0,12%, μήνες) · Σύνολο = δόσεις + εισφορά';

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
    this.persistence.initMortgageForm(this.loanForm, this.destroyRef, {
      onLoadErList: (list) => this.erList.set(list),
      onSave: () => this.persist(),
    });
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

  shareSummary = computed(() => {
    const s = this.summary();
    return `Στεγαστικό δάνειο Salaries.gr: δόση ${s.fixedPayment.toFixed(2)}€ (σταθερή), σύνολο ${s.grandTotal.toFixed(2)}€`;
  });

  onErListChange(updated: EarlyRepayment[]): void {
    this.erList.set(updated);
    this.persist();
  }

  onErModeChange(mode: 'reducePmt' | 'reduceDur'): void {
    this.loanForm.patchValue({ erMode: mode });
    this.persist();
  }

  onExportCsv(): void {
    this.exportSvc.exportAmortizationCSV(this.schedule());
  }

  private persist(): void {
    this.persistence.saveState(this.loanForm.value, this.erList(), 0);
  }
}
