import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  ViewChild,
} from '@angular/core';
import { AmortizationRow } from '../../models/mortgage.models';

@Component({
  selector: 'app-amortization-chart',
  standalone: false,
  templateUrl: './amortization-chart.component.html',
  styleUrl: './amortization-chart.component.scss',
})
export class AmortizationChartComponent implements OnChanges {
  @Input() schedule: AmortizationRow[] = [];
  @ViewChild('chartCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  viewMode: 'monthly' | 'yearly' = 'yearly';
  private userOverride = false;

  ngOnChanges(): void {
    if (!this.userOverride) {
      this.viewMode = this.schedule.length <= 24 ? 'monthly' : 'yearly';
    }
    this.draw();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.draw();
  }

  toggleView(): void {
    this.userOverride = true;
    this.viewMode = this.viewMode === 'yearly' ? 'monthly' : 'yearly';
    this.draw();
  }

  draw(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    const W = canvas.parentElement?.clientWidth || 600;
    const H = 240;
    canvas.width  = W;
    canvas.height = H;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    const buckets: Record<number, { p: number; i: number }> = {};
    if (this.viewMode === 'monthly') {
      for (const r of this.schedule) {
        if (!buckets[r.month]) buckets[r.month] = { p: 0, i: 0 };
        buckets[r.month].p += r.principal + r.earlyAmt;
        buckets[r.month].i += r.interest;
      }
    } else {
      for (const r of this.schedule) {
        const yr = Math.ceil(r.month / 12);
        if (!buckets[yr]) buckets[yr] = { p: 0, i: 0 };
        buckets[yr].p += r.principal + r.earlyAmt;
        buckets[yr].i += r.interest;
      }
    }

    const keys = Object.keys(buckets).map(Number).sort((a, b) => a - b);
    if (!keys.length) return;

    const maxVal = Math.max(...keys.map(k => buckets[k].p + buckets[k].i));
    if (maxVal <= 0) return;

    const PL = 52, PR = 12, PT = 16, PB = 28;
    const cW = W - PL - PR;
    const cH = H - PT - PB;
    const bW = Math.max(3, Math.min(26, (cW / keys.length) * 0.65));
    const gap = cW / keys.length;

    const gridN = 4;
    for (let i = 0; i <= gridN; i++) {
      const y   = PT + cH * (1 - i / gridN);
      const val = maxVal * i / gridN;
      ctx.strokeStyle = '#f3f4f6';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(PL, y);
      ctx.lineTo(W - PR, y);
      ctx.stroke();
      ctx.fillStyle = '#9ca3af';
      ctx.font      = '10px system-ui, sans-serif';
      ctx.textAlign = 'right';
      const lbl = val >= 1000 ? (val / 1000).toFixed(0) + 'K' : val.toFixed(0);
      ctx.fillText('€' + lbl, PL - 4, y + 4);
    }

    keys.forEach((key, i) => {
      const d   = buckets[key];
      const x   = PL + i * gap + gap / 2 - bW / 2;
      const tot = d.p + d.i;

      const totalH    = tot / maxVal * cH;
      const principH  = d.p / maxVal * cH;
      const interestH = d.i / maxVal * cH;

      ctx.fillStyle = '#dc2626';
      ctx.fillRect(x, PT + cH - totalH, bW, interestH);
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(x, PT + cH - principH, bW, principH);

      let every: number;
      if (this.viewMode === 'monthly') {
        every = keys.length <= 12 ? 1 : keys.length <= 24 ? 2 : keys.length <= 60 ? 6 : 12;
      } else {
        every = keys.length <= 10 ? 1 : keys.length <= 20 ? 2 : 5;
      }

      const isFirst = i === 0;
      const isLast  = i === keys.length - 1;
      if (isFirst || isLast || key % every === 0) {
        ctx.fillStyle = '#6b7280';
        ctx.font      = '10px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(key), x + bW / 2, H - 6);
      }
    });

    const axisLabel = this.viewMode === 'monthly' ? 'Μήνες' : 'Έτη';
    ctx.fillStyle = '#9ca3af';
    ctx.font      = '10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(axisLabel, W / 2, H - 6);
  }
}
