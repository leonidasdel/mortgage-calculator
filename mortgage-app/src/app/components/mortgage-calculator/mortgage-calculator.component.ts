import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, linkedSignal, signal } from '@angular/core';
import { form } from '@angular/forms/signals';
import { EarlyRepayment, LoanParams } from '../../models/mortgage.models';
import { MortgageCalculatorService } from '../../services/mortgage-calculator.service';
import { PersistenceService } from '../../services/persistence.service';
import { ExportService } from '../../services/export.service';
import { RateFeedService } from '../../services/rate-feed.service';
import { DEFAULT_EURIBOR_RATE } from '../../constants/euribor.constants';
import { EuroPipe } from '../../pipes/euro.pipe';
import { AmortizationChartComponent } from '../amortization-chart/amortization-chart.component';
import { AmortizationTableComponent } from '../amortization-table/amortization-table.component';
import { CalcExplanationComponent } from '../calc-explanation/calc-explanation.component';
import { EarlyRepaymentsComponent } from '../early-repayments/early-repayments.component';
import { ExportRowComponent } from '../export-row/export-row.component';
import { LawFooterComponent } from '../law-footer/law-footer.component';
import { LoanFormComponent } from '../loan-form/loan-form.component';
import { SummaryPanelComponent } from '../summary-panel/summary-panel.component';

const DEFAULT_LOAN_PARAMS: LoanParams = {
  loanAmount: 100000,
  loanYears: 30,
  fixedYears: 5,
  fixedRate: 2.9,
  euribor: DEFAULT_EURIBOR_RATE,
  bankMargin: 2.1,
  gracePeriod: 0,
  erMode: 'reducePmt',
};

@Component({
  selector: 'app-mortgage-calculator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EuroPipe, AmortizationChartComponent, AmortizationTableComponent, CalcExplanationComponent, EarlyRepaymentsComponent, ExportRowComponent, LawFooterComponent, LoanFormComponent, SummaryPanelComponent],
  templateUrl: './mortgage-calculator.component.html',
  styleUrl: './mortgage-calculator.component.scss',
})
export class MortgageCalculatorComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly calc = inject(MortgageCalculatorService);
  private readonly persistence = inject(PersistenceService);
  private readonly exportSvc = inject(ExportService);
  readonly rateFeed = inject(RateFeedService);

  formModel = linkedSignal<{ useLive: boolean; live: number | null }, LoanParams>({
    source: () => ({
      useLive: this.rateFeed.useLiveRate(),
      live: this.rateFeed.liveRate(),
    }),
    computation: (src, prev) => {
      const current = prev?.value ?? { ...DEFAULT_LOAN_PARAMS };
      if (src.useLive && src.live != null) {
        return current.euribor === src.live ? current : { ...current, euribor: src.live };
      }
      if (prev?.source.useLive && !src.useLive) {
        return { ...current, euribor: DEFAULT_EURIBOR_RATE };
      }
      return current;
    },
  });
  formFields = form(this.formModel);
  erList = signal<EarlyRepayment[]>([]);

  constructor() {
    this.persistence.initMortgageForm(this.formModel, this.destroyRef, {
      onLoadErList: (list) => this.erList.set(list),
      onSave: () => this.persist(),
    });
  }

  readonly explanationSteps = [
    'Η δόση υπολογίζεται με τύπο PMT για σταθερή και κυμαινόμενη περίοδο.',
    'Προστίθεται εισφορά Ν.128/1975 0,12% επί του ανεξόφλητου κεφαλαίου.',
    'Κυμαινόμενο επιτόκιο = Euribor + περιθώριο τράπεζας.',
    'Οι πρόωρες αποπληρωμές μειώνουν δόση ή διάρκεια.',
  ];

  readonly explanationFormula =
    'Δόση = PMT(κεφάλαιο, επιτόκιο + 0,12%, μήνες) · Σύνολο = δόσεις + εισφορά';

  schedule = computed(() => this.calc.buildSchedule(this.formModel(), this.erList()));
  baseSchedule = computed(() => this.calc.buildSchedule(this.formModel(), []));
  summary = computed(() => this.calc.computeSummary(this.schedule(), this.baseSchedule(), this.formModel()));
  erMonthsSaved = computed(() => this.calc.computeErMonthsSaved(this.formModel(), this.erList()));

  shareSummary = computed(() => {
    const s = this.summary();
    return `Στεγαστικό δάνειο Salaries.gr: δόση ${s.fixedPayment.toFixed(2)}€ (σταθερή), σύνολο ${s.grandTotal.toFixed(2)}€`;
  });

  onLiveEuriborToggle(enabled: boolean): void {
    this.rateFeed.toggleUseLiveRate(enabled);
  }

  onErListChange(updated: EarlyRepayment[]): void {
    this.erList.set(updated);
    this.persist();
  }

  onErModeChange(mode: 'reducePmt' | 'reduceDur'): void {
    this.formModel.update(m => ({ ...m, erMode: mode }));
    this.persist();
  }

  onExportCsv(): void {
    this.exportSvc.exportAmortizationCSV(this.schedule());
  }

  private persist(): void {
    this.persistence.saveState(this.formModel(), this.erList(), 0);
  }
}
