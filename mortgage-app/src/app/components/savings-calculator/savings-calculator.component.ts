import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { form, FormField } from '@angular/forms/signals';
import { CompareRow } from '../compare-panel/compare-panel.component';
import { CalculatorPersistenceService } from '../../services/calculator-persistence.service';
import {
  SavingsCalculatorService,
  SavingsResult,
  SavingsYearRow,
} from '../../services/savings-calculator.service';
import {
  drawHorizontalGrid,
  formatSavingsAxis,
  getSavingsChartTheme,
  isDarkTheme,
  setupCanvas,
} from '../../utils/chart-canvas.util';

const STORAGE_KEY = 'savingsCalcState';

interface SavingsModel {
  initialDeposit: number;
  monthlyContribution: number;
  compareMonthlyContribution: number;
  annualReturn: number;
  durationYears: number;
  applyTax: boolean;
  taxRate: number;
  applyInflation: boolean;
  inflationRate: number;
}

import { CommonModule } from '@angular/common';
import { EuroPipe } from '../../pipes/euro.pipe';
import { ChartResizeDirective } from '../../directives/chart-resize.directive';
import { CalcExplanationComponent } from '../calc-explanation/calc-explanation.component';
import { ComparePanelComponent } from '../compare-panel/compare-panel.component';
import { ExportRowComponent } from '../export-row/export-row.component';
import { LawFooterComponent } from '../law-footer/law-footer.component';
@Component({
  selector: 'app-savings-calculator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormField,
    EuroPipe,
    ChartResizeDirective,
    CalcExplanationComponent,
    ComparePanelComponent,
    ExportRowComponent,
    LawFooterComponent,
  ],
  templateUrl: './savings-calculator.component.html',
  styleUrl: './savings-calculator.component.scss',
})
export class SavingsCalculatorComponent {
  formModel = signal<SavingsModel>({
    initialDeposit: 10000,
    monthlyContribution: 200,
    compareMonthlyContribution: 400,
    annualReturn: 7,
    durationYears: 20,
    applyTax: true,
    taxRate: 15,
    applyInflation: false,
    inflationRate: 2,
  });
  formFields = form(this.formModel);

  private readonly destroyRef = inject(DestroyRef);
  private readonly calc = inject(SavingsCalculatorService);
  private readonly persistence = inject(CalculatorPersistenceService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly quickDurations = [5, 10, 15, 20, 25, 30];

  readonly explanationSteps = [
    'Κάθε μήνα προστίθεται η μηνιαία εισφορά στο υπόλοιπο μετά τον μηνιαίο τόκο.',
    'Η ετήσια απόδοση μειώνεται κατά τον φόρο τόκων (προαιρετικά 15%).',
    'Ο πληθωρισμός μειώνει την πραγματική αξία στο τέλος της περιόδου.',
    'Τα κέρδη = τελικό ποσό − συνολικές εισφορές (αρχικό + μηνιαίες).',
  ];

  readonly explanationFormula = 'Τελικό = αρχικό × (1+r)^n + μηνιαία × [(1+r)^n − 1] / r';

  canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('savingsChart');

  constructor() {
    effect(() => {
      const rows = this.result().yearlyRows;
      if (this.isBrowser) {
        setTimeout(() => this.drawChart(rows), 0);
      }
    });

    this.persistence.initSignalForm(this.formModel, STORAGE_KEY, this.destroyRef);
  }

  result = computed<SavingsResult>(() => this.calc.calculate(this.formModel()));

  compareResult = computed(() => {
    const fv = this.formModel();
    const monthly = Math.max(0, fv.compareMonthlyContribution || 0);
    return this.calc.calculate(fv, monthly);
  });

  compareRows = computed((): CompareRow[] => {
    const a = this.result();
    const b = this.compareResult();
    const fmt = (n: number) => `${Math.round(n).toLocaleString('el-GR')} €`;
    const pick = (va: number, vb: number): 'a' | 'b' | undefined =>
      va > vb ? 'a' : vb > va ? 'b' : undefined;
    const monthlyA = Math.max(0, this.formModel().monthlyContribution || 0);
    const monthlyB = Math.max(0, this.formModel().compareMonthlyContribution || 0);
    return [
      { label: 'Μηνιαία εισφορά', valueA: fmt(monthlyA), valueB: fmt(monthlyB) },
      {
        label: 'Συνολικές εισφορές',
        valueA: fmt(a.totalContributed),
        valueB: fmt(b.totalContributed),
      },
      {
        label: 'Καθαρά κέρδη',
        valueA: fmt(a.netGains),
        valueB: fmt(b.netGains),
        highlight: pick(a.netGains, b.netGains),
      },
      {
        label: 'Τελικό ποσό',
        valueA: fmt(a.finalNominal),
        valueB: fmt(b.finalNominal),
        highlight: pick(a.finalNominal, b.finalNominal),
      },
    ];
  });

  shareSummary = computed(() => {
    const r = this.result();
    return `Αποταμίευση Salaries.gr: τελικό ${Math.round(r.finalNominal)}€ μετά ${this.formModel().durationYears} έτη`;
  });

  setYears(y: number): void {
    this.formModel.update((m) => ({ ...m, durationYears: y }));
  }

  onChartResize(): void {
    this.drawChart(this.result().yearlyRows);
  }

  private drawChart(rows: SavingsYearRow[]): void {
    const canvas = this.canvasRef().nativeElement;
    if (!canvas || !rows.length) return;

    const W = canvas.parentElement?.clientWidth || 600;
    const H = 260;
    const ctx = setupCanvas(canvas, W, H);
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    const maxVal = Math.max(...rows.map((r) => r.totalValue));
    if (maxVal <= 0) return;

    const PL = 60,
      PR = 12,
      PT = 16,
      PB = 28;
    const pad = { l: PL, r: PR, t: PT, b: PB };
    const cW = W - PL - PR;
    const cH = H - PT - PB;
    const bW = Math.max(3, Math.min(28, (cW / rows.length) * 0.65));
    const gap = cW / rows.length;
    const theme = getSavingsChartTheme(isDarkTheme());

    drawHorizontalGrid(
      ctx,
      W,
      H,
      maxVal,
      pad,
      theme.grid,
      theme.label,
      formatSavingsAxis,
      4,
      '10px system-ui, sans-serif',
    );

    rows.forEach((r, i) => {
      const x = PL + i * gap + gap / 2 - bW / 2;
      const totalH = (r.totalValue / maxVal) * cH;
      const contribH = (r.totalContributed / maxVal) * cH;
      const gainsH = totalH - contribH;

      ctx.fillStyle = theme.gains;
      ctx.fillRect(x, PT + cH - totalH, bW, gainsH > 0 ? gainsH : 0);
      ctx.fillStyle = theme.contribution;
      ctx.fillRect(x, PT + cH - contribH, bW, contribH);

      const every = rows.length <= 10 ? 1 : rows.length <= 20 ? 2 : 5;
      if (r.year === 1 || r.year % every === 0 || r.year === rows.length) {
        ctx.fillStyle = theme.axis;
        ctx.font = '10px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(r.year), x + bW / 2, H - 6);
      }
    });
  }
}
