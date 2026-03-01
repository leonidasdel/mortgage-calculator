import { Component, computed, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

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

  @ViewChild('savingsChart', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      initialDeposit:      [10000],
      monthlyContribution: [200],
      annualReturn:        [7],
      durationYears:       [20],
      applyTax:            [true],
      taxRate:             [15],
      applyInflation:      [false],
      inflationRate:       [2],
    });
    this.formValues = toSignal(this.form.valueChanges, { initialValue: this.form.value });
  }

  ngOnInit(): void {
    this.loadState();
    this.form.valueChanges.subscribe(() => this.saveState());
  }

  result = computed<SavingsResult>(() => {
    this.formValues();
    const fv = this.form.value;
    const P = Math.max(0, fv.initialDeposit || 0);
    const C = Math.max(0, fv.monthlyContribution || 0);
    const annualRate = Math.max(0, fv.annualReturn || 0) / 100;
    const years = Math.max(1, Math.min(50, Math.round(fv.durationYears || 20)));
    const doTax = !!fv.applyTax;
    const taxRate = doTax ? Math.max(0, fv.taxRate || 15) / 100 : 0;
    const doInflation = !!fv.applyInflation;
    const inflRate = doInflation ? Math.max(0, fv.inflationRate || 0) / 100 : 0;

    const netAnnual = annualRate * (1 - taxRate);
    const mRate = netAnnual / 12;

    const rows: SavingsYearRow[] = [];
    let balance = P;
    let prevGains = 0;

    for (let y = 1; y <= years; y++) {
      const balanceStartOfYear = balance;
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

    // Gross gains (before tax) for summary
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

    const res: SavingsResult = {
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

    // Draw chart after computation
    setTimeout(() => this.drawChart(rows), 0);

    return res;
  });

  setYears(y: number): void {
    this.form.patchValue({ durationYears: y });
  }

  print(): void {
    window.print();
  }

  @HostListener('window:resize')
  onResize(): void {
    const rows = this.result().yearlyRows;
    this.drawChart(rows);
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

    // Grid lines
    const gridN = 4;
    for (let i = 0; i <= gridN; i++) {
      const y = PT + cH * (1 - i / gridN);
      const val = maxVal * i / gridN;
      ctx.strokeStyle = '#f3f4f6';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PL, y);
      ctx.lineTo(W - PR, y);
      ctx.stroke();
      ctx.fillStyle = '#9ca3af';
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'right';
      const lbl = val >= 1000 ? (val / 1000).toFixed(0) + 'K' : val.toFixed(0);
      ctx.fillText('€' + lbl, PL - 4, y + 4);
    }

    // Bars
    rows.forEach((r, i) => {
      const x = PL + i * gap + gap / 2 - bW / 2;
      const totalH = r.totalValue / maxVal * cH;
      const contribH = r.totalContributed / maxVal * cH;
      const gainsH = totalH - contribH;

      // Gains (green) on top
      ctx.fillStyle = '#059669';
      ctx.fillRect(x, PT + cH - totalH, bW, gainsH > 0 ? gainsH : 0);
      // Contributions (blue) on bottom
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(x, PT + cH - contribH, bW, contribH);

      // X-axis labels
      const every = rows.length <= 10 ? 1 : rows.length <= 20 ? 2 : 5;
      if (r.year === 1 || r.year % every === 0 || r.year === rows.length) {
        ctx.fillStyle = '#6b7280';
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
