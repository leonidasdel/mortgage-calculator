import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  Injector,
  OnDestroy,
  PLATFORM_ID,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { form, FormField } from '@angular/forms/signals';
import { CommonModule } from '@angular/common';
import { EuroPipe } from '../../pipes/euro.pipe';
import { ChartResizeDirective } from '../../directives/chart-resize.directive';
import { CalcExplanationComponent } from '../calc-explanation/calc-explanation.component';
import { ComparePanelComponent } from '../compare-panel/compare-panel.component';
import { ExportRowComponent } from '../export-row/export-row.component';
import { LawFooterComponent } from '../law-footer/law-footer.component';
import { SavingsYearRow } from '../../services/savings-calculator.service';
import {
  drawHorizontalGrid,
  formatSavingsAxis,
  getSavingsChartTheme,
  isDarkTheme,
  setupCanvas,
} from '../../utils/chart-canvas.util';
import { SavingsStore } from './savings.store';

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
  providers: [SavingsStore],
  templateUrl: './savings-calculator.component.html',
  styleUrl: './savings-calculator.component.scss',
})
export class SavingsCalculatorComponent implements OnDestroy {
  readonly store = inject(SavingsStore);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly injector = inject(Injector);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly formFields = form(this.store.formModelWritable);
  readonly formModel = this.store.formModel;
  readonly result = this.store.result;
  readonly compareResult = this.store.compareResult;
  readonly compareRows = this.store.compareRows;
  readonly shareSummary = this.store.shareSummary;

  readonly quickDurations = [5, 10, 15, 20, 25, 30];

  readonly explanationSteps = [
    'Κάθε μήνα προστίθεται η μηνιαία εισφορά στο υπόλοιπο μετά τον μηνιαίο τόκο.',
    'Η ετήσια απόδοση μειώνεται κατά τον φόρο τόκων (προαιρετικά 15%).',
    'Ο πληθωρισμός μειώνει την πραγματική αξία στο τέλος της περιόδου.',
    'Τα κέρδη = τελικό ποσό − συνολικές εισφορές (αρχικό + μηνιαίες).',
  ];

  readonly explanationFormula = 'Τελικό = αρχικό × (1+r)^n + μηνιαία × [(1+r)^n − 1] / r';

  canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('savingsChart');

  private resizeObserver?: ResizeObserver;

  constructor() {
    effect(() => {
      const rows = this.result().yearlyRows;
      const canvas = this.canvasRef();
      if (!this.isBrowser || !canvas || !rows.length) return;

      afterNextRender(
        () => {
          this.attachResizeObserver();
          this.drawChart(rows);
        },
        { injector: this.injector },
      );
    });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  private attachResizeObserver(): void {
    const canvas = this.canvasRef()?.nativeElement;
    const parent = canvas?.parentElement;
    if (!parent || typeof ResizeObserver === 'undefined') return;

    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver(() => {
      this.drawChart(this.result().yearlyRows);
    });
    this.resizeObserver.observe(parent);
    this.drawChart(this.result().yearlyRows);
  }

  setYears(y: number): void {
    this.store.formModelWritable.update((m) => ({ ...m, durationYears: y }));
  }

  onChartResize(): void {
    this.drawChart(this.result().yearlyRows);
  }

  private drawChart(rows: SavingsYearRow[]): void {
    const canvas = this.canvasRef()?.nativeElement;
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
