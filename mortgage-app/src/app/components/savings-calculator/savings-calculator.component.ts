import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, OnInit, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
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

import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { EuroPipe } from '../../pipes/euro.pipe';
import { ChartResizeDirective } from '../../directives/chart-resize.directive';
import { CalcExplanationComponent } from '../calc-explanation/calc-explanation.component';
import { ComparePanelComponent } from '../compare-panel/compare-panel.component';
import { ExportRowComponent } from '../export-row/export-row.component';
import { LawFooterComponent } from '../law-footer/law-footer.component';
@Component({
  selector: 'app-savings-calculator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, EuroPipe, ChartResizeDirective, CalcExplanationComponent, ComparePanelComponent, ExportRowComponent, LawFooterComponent],
  templateUrl: './savings-calculator.component.html',
  styleUrl: './savings-calculator.component.scss',
})
export class SavingsCalculatorComponent implements OnInit {
  form: FormGroup;
  private formValues;
  private destroyRef = inject(DestroyRef);

  readonly quickDurations = [5, 10, 15, 20, 25, 30];

  readonly explanationSteps = [
    'Κάθε μήνα προστίθεται η μηνιαία εισφορά στο υπόλοιπο μετά τον μηνιαίο τόκο.',
    'Η ετήσια απόδοση μειώνεται κατά τον φόρο τόκων (προαιρετικά 15%).',
    'Ο πληθωρισμός μειώνει την πραγματική αξία στο τέλος της περιόδου.',
    'Τα κέρδη = τελικό ποσό − συνολικές εισφορές (αρχικό + μηνιαίες).',
  ];

  readonly explanationFormula =
    'Τελικό = αρχικό × (1+r)^n + μηνιαία × [(1+r)^n − 1] / r';

  @ViewChild('savingsChart', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  constructor(
    private fb: FormBuilder,
    private calc: SavingsCalculatorService,
    private persistence: CalculatorPersistenceService,
  ) {
    effect(() => {
      const rows = this.result().yearlyRows;
      setTimeout(() => this.drawChart(rows), 0);
    });

    this.form = this.fb.group({
      initialDeposit: [10000],
      monthlyContribution: [200],
      compareMonthlyContribution: [400],
      annualReturn: [7],
      durationYears: [20],
      applyTax: [true],
      taxRate: [15],
      applyInflation: [false],
      inflationRate: [2],
    });
    this.formValues = toSignal(this.form.valueChanges, { initialValue: this.form.value });
  }

  ngOnInit(): void {
    this.persistence.initCalculatorForm(this.form, STORAGE_KEY, this.destroyRef);
  }

  result = computed<SavingsResult>(() => {
    this.formValues();
    return this.calc.calculate(this.form.value);
  });

  compareResult = computed(() => {
    this.formValues();
    const fv = this.form.value;
    const monthly = Math.max(0, fv.compareMonthlyContribution || 0);
    return this.calc.calculate(fv, monthly);
  });

  compareRows = computed((): CompareRow[] => {
    const a = this.result();
    const b = this.compareResult();
    const fmt = (n: number) => `${Math.round(n).toLocaleString('el-GR')} €`;
    const pick = (va: number, vb: number): 'a' | 'b' | undefined =>
      va > vb ? 'a' : vb > va ? 'b' : undefined;
    const monthlyA = Math.max(0, this.form.value.monthlyContribution || 0);
    const monthlyB = Math.max(0, this.form.value.compareMonthlyContribution || 0);
    return [
      { label: 'Μηνιαία εισφορά', valueA: fmt(monthlyA), valueB: fmt(monthlyB) },
      { label: 'Συνολικές εισφορές', valueA: fmt(a.totalContributed), valueB: fmt(b.totalContributed) },
      { label: 'Καθαρά κέρδη', valueA: fmt(a.netGains), valueB: fmt(b.netGains), highlight: pick(a.netGains, b.netGains) },
      { label: 'Τελικό ποσό', valueA: fmt(a.finalNominal), valueB: fmt(b.finalNominal), highlight: pick(a.finalNominal, b.finalNominal) },
    ];
  });

  shareSummary = computed(() => {
    const r = this.result();
    return `Αποταμίευση Salaries.gr: τελικό ${Math.round(r.finalNominal)}€ μετά ${this.form.value.durationYears} έτη`;
  });

  setYears(y: number): void {
    this.form.patchValue({ durationYears: y });
  }

  onChartResize(): void {
    this.drawChart(this.result().yearlyRows);
  }

  private drawChart(rows: SavingsYearRow[]): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !rows.length) return;

    const W = canvas.parentElement?.clientWidth || 600;
    const H = 260;
    const ctx = setupCanvas(canvas, W, H);
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    const maxVal = Math.max(...rows.map(r => r.totalValue));
    if (maxVal <= 0) return;

    const PL = 60, PR = 12, PT = 16, PB = 28;
    const pad = { l: PL, r: PR, t: PT, b: PB };
    const cW = W - PL - PR;
    const cH = H - PT - PB;
    const bW = Math.max(3, Math.min(28, (cW / rows.length) * 0.65));
    const gap = cW / rows.length;
    const theme = getSavingsChartTheme(isDarkTheme());

    drawHorizontalGrid(
      ctx, W, H, maxVal, pad, theme.grid, theme.label, formatSavingsAxis, 4,
      '10px system-ui, sans-serif',
    );

    rows.forEach((r, i) => {
      const x = PL + i * gap + gap / 2 - bW / 2;
      const totalH = r.totalValue / maxVal * cH;
      const contribH = r.totalContributed / maxVal * cH;
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
