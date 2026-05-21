import { Component, computed, effect, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { CompareRow } from '../compare-panel/compare-panel.component';
import { ShareStateService } from '../../services/share-state.service';

const STORAGE_KEY = 'savingsCalcState';

interface SavingsYearRow {
  year: number;
  totalContributed: number;
  yearlyGains: number;
  gains: number;
  totalValue: number;
  realValue: number | null;
}

interface SavingsResult {
  finalNominal: number;
  finalReal: number | null;
  totalContributed: number;
  grossGains: number;
  totalTax: number;
  netGains: number;
  yearlyRows: SavingsYearRow[];
  applyTax: boolean;
  applyInflation: boolean;
}

@Component({
  selector: 'app-savings-calculator',
  standalone: false,
  templateUrl: './savings-calculator.component.html',
  styleUrl: './savings-calculator.component.scss',
})
export class SavingsCalculatorComponent implements OnInit {
  form: FormGroup;
  private formValues;

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
    private shareSvc: ShareStateService,
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
    this.loadState();
    const qp = this.shareSvc.getQueryParams();
    if (Object.keys(qp).length) {
      this.form.patchValue(this.shareSvc.deserializeState(qp), { emitEvent: false });
    }
    this.form.valueChanges.subscribe(() => this.saveState());
  }

  result = computed<SavingsResult>(() => {
    this.formValues();
    return this.computeSavings(this.form.value);
  });

  compareResult = computed(() => {
    this.formValues();
    const fv = this.form.value;
    const monthly = Math.max(0, fv.compareMonthlyContribution || 0);
    return this.computeSavings(fv, monthly);
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

  private computeSavings(fv: Record<string, unknown>, monthlyOverride?: number): SavingsResult {
    const P = Math.max(0, Number(fv['initialDeposit']) || 0);
    const C = monthlyOverride ?? Math.max(0, Number(fv['monthlyContribution']) || 0);
    const annualRate = Math.max(0, Number(fv['annualReturn']) || 0) / 100;
    const years = Math.max(1, Math.min(50, Math.round(Number(fv['durationYears']) || 20)));
    const doTax = !!fv['applyTax'];
    const taxRate = doTax ? Math.max(0, Number(fv['taxRate']) || 15) / 100 : 0;
    const doInflation = !!fv['applyInflation'];
    const inflRate = doInflation ? Math.max(0, Number(fv['inflationRate']) || 0) / 100 : 0;

    const netAnnual = annualRate * (1 - taxRate);
    const mRate = netAnnual / 12;

    const rows: SavingsYearRow[] = [];
    let balance = P;
    let prevGains = 0;

    for (let y = 1; y <= years; y++) {
      for (let m = 0; m < 12; m++) {
        balance = balance * (1 + mRate) + C;
      }
      const contributed = P + C * 12 * y;
      const gains = balance - contributed;
      const yearlyGains = gains - prevGains;
      prevGains = gains;
      const realValue = doInflation ? balance / Math.pow(1 + inflRate, y) : null;
      rows.push({ year: y, totalContributed: contributed, yearlyGains, gains, totalValue: balance, realValue });
    }

    const mGross = annualRate / 12;
    let grossBal = P;
    for (let y = 0; y < years; y++) {
      for (let m = 0; m < 12; m++) {
        grossBal = grossBal * (1 + mGross) + C;
      }
    }
    const totalContributed = P + C * 12 * years;
    const grossGains = grossBal - totalContributed;
    const totalTax = grossGains - (balance - totalContributed);
    const netGains = balance - totalContributed;
    const finalReal = doInflation ? balance / Math.pow(1 + inflRate, years) : null;

    return {
      finalNominal: balance,
      finalReal,
      totalContributed,
      grossGains,
      totalTax: Math.max(0, totalTax),
      netGains,
      yearlyRows: rows,
      applyTax: doTax,
      applyInflation: doInflation,
    };
  }

  setYears(y: number): void {
    this.form.patchValue({ durationYears: y });
  }

  @HostListener('window:resize')
  onResize(): void {
    this.drawChart(this.result().yearlyRows);
  }

  @HostListener('window:themechange')
  onThemeChange(): void {
    this.drawChart(this.result().yearlyRows);
  }

  private drawChart(rows: SavingsYearRow[]): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !rows.length) return;

    const W = canvas.parentElement?.clientWidth || 600;
    const H = 260;
    canvas.width = W;
    canvas.height = H;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    const maxVal = Math.max(...rows.map(r => r.totalValue));
    if (maxVal <= 0) return;

    const PL = 60, PR = 12, PT = 16, PB = 28;
    const cW = W - PL - PR;
    const cH = H - PT - PB;
    const bW = Math.max(3, Math.min(28, (cW / rows.length) * 0.65));
    const gap = cW / rows.length;
    const isDark = document.documentElement.classList.contains('dark');
    const gridColor = isDark ? '#64748b' : '#f3f4f6';
    const labelColor = isDark ? '#cbd5e1' : '#9ca3af';
    const axisColor = isDark ? '#e2e8f0' : '#6b7280';
    const gainsColor = isDark ? '#86efac' : '#059669';
    const contributionColor = isDark ? '#60a5fa' : '#1d4ed8';

    const gridN = 4;
    for (let i = 0; i <= gridN; i++) {
      const y = PT + cH * (1 - i / gridN);
      const val = maxVal * i / gridN;
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PL, y);
      ctx.lineTo(W - PR, y);
      ctx.stroke();
      ctx.fillStyle = labelColor;
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'right';
      const lbl = val >= 1000 ? (val / 1000).toFixed(0) + 'K' : val.toFixed(0);
      ctx.fillText('€' + lbl, PL - 4, y + 4);
    }

    rows.forEach((r, i) => {
      const x = PL + i * gap + gap / 2 - bW / 2;
      const totalH = r.totalValue / maxVal * cH;
      const contribH = r.totalContributed / maxVal * cH;
      const gainsH = totalH - contribH;

      ctx.fillStyle = gainsColor;
      ctx.fillRect(x, PT + cH - totalH, bW, gainsH > 0 ? gainsH : 0);
      ctx.fillStyle = contributionColor;
      ctx.fillRect(x, PT + cH - contribH, bW, contribH);

      const every = rows.length <= 10 ? 1 : rows.length <= 20 ? 2 : 5;
      if (r.year === 1 || r.year % every === 0 || r.year === rows.length) {
        ctx.fillStyle = axisColor;
        ctx.font = '10px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(r.year), x + bW / 2, H - 6);
      }
    });
  }

  private saveState(): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.form.value)); } catch { /* ignore */ }
  }

  private loadState(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const state = JSON.parse(raw);
      if (state) this.form.patchValue(state, { emitEvent: false });
    } catch { /* ignore */ }
  }
}
