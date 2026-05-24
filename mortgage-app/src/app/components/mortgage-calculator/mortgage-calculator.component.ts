import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { form } from '@angular/forms/signals';
import { EarlyRepayment } from '../../models/mortgage.models';
import { ExportService } from '../../services/export.service';
import { RateFeedService } from '../../services/rate-feed.service';
import { MortgageStore } from './mortgage.store';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EuroPipe,
    AmortizationChartComponent,
    AmortizationTableComponent,
    CalcExplanationComponent,
    EarlyRepaymentsComponent,
    ExportRowComponent,
    LawFooterComponent,
    LoanFormComponent,
    SummaryPanelComponent,
  ],
  providers: [MortgageStore],
  templateUrl: './mortgage-calculator.component.html',
  styleUrl: './mortgage-calculator.component.scss',
})
export class MortgageCalculatorComponent {
  readonly store = inject(MortgageStore);
  readonly rateFeed = inject(RateFeedService);
  private readonly exportSvc = inject(ExportService);

  readonly formFields = form(this.store.formModelWritable);

  // Expose signals directly to preserve HTML template references
  readonly formModel = this.store.formModel;
  readonly erList = this.store.erList;
  readonly schedule = this.store.schedule;
  readonly baseSchedule = this.store.baseSchedule;
  readonly summary = this.store.summary;
  readonly erMonthsSaved = this.store.erMonthsSaved;
  readonly shareSummary = this.store.shareSummary;

  readonly explanationSteps = [
    'Η δόση υπολογίζεται με τύπο PMT για σταθερή και κυμαινόμενη περίοδο.',
    'Προστίθεται εισφορά Ν.128/1975 0,12% επί του ανεξόφλητου κεφαλαίου.',
    'Κυμαινόμενο επιτόκιο = Euribor + περιθώριο τράπεζας.',
    'Οι πρόωρες αποπληρωμές μειώνουν δόση ή διάρκεια.',
  ];

  readonly explanationFormula =
    'Δόση = PMT(κεφάλαιο, επιτόκιο + 0,12%, μήνες) · Σύνολο = δόσεις + εισφορά';

  onLiveEuriborToggle(enabled: boolean): void {
    this.store.onLiveEuriborToggle(enabled);
  }

  onErListChange(updated: EarlyRepayment[]): void {
    this.store.onErListChange(updated);
  }

  onErModeChange(mode: 'reducePmt' | 'reduceDur'): void {
    this.store.onErModeChange(mode);
  }

  onExportCsv(): void {
    this.exportSvc.exportAmortizationCSV(this.schedule());
  }
}
