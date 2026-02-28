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

  ngOnChanges(): void {
    this.draw();
  }

  @HostListener('window:resize')
  onResize(): void {
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

    const years: Record<number, { p: number; i: number }> = {};
    for (const r of this.schedule) {
      const yr = Math.ceil(r.month / 12);
      if (!years[yr]) years[yr] = { p: 0, i: 0 };
      years[yr].p += r.principal + r.earlyAmt;
      years[yr].i += r.interest;
    }

    const keys = Object.keys(years).map(Number).sort((a, b) => a - b);
    if (!keys.length) return;

    const maxVal = Math.max(...keys.map(k => years[k].p + years[k].i));
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

    keys.forEach((yr, i) => {
      const d   = years[yr];
      const x   = PL + i * gap + gap / 2 - bW / 2;
      const tot = d.p + d.i;

      const totalH    = tot / maxVal * cH;
      const principH  = d.p / maxVal * cH;
      const interestH = d.i / maxVal * cH;

      ctx.fillStyle = '#dc2626';
      ctx.fillRect(x, PT + cH - totalH, bW, interestH);
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(x, PT + cH - principH, bW, principH);

      const every = keys.length <= 10 ? 1 : keys.length <= 20 ? 2 : 5;
      if (yr === 1 || yr % every === 0 || yr === keys[keys.length - 1]) {
        ctx.fillStyle = '#6b7280';
        ctx.font      = '10px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(yr), x + bW / 2, H - 6);
      }
    });

    ctx.fillStyle = '#9ca3af';
    ctx.font      = '10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Έτη', W / 2, H - 6);
  }
}
