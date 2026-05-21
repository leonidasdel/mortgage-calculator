import {
  Component,
  ElementRef,
  HostListener,
  Input,
  AfterViewInit,
  OnChanges,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { AmortizationRow } from '../../models/mortgage.models';

interface ChartBucket {
  key: number;
  principal: number;
  interest: number;
}

interface BarHit {
  key: number;
  x: number;
  y: number;
  w: number;
  h: number;
  principal: number;
  interest: number;
}

interface ChartTheme {
  grid: string;
  axis: string;
  label: string;
  principal: string;
  interest: string;
  principalHover: string;
  interestHover: string;
}

@Component({
  selector: 'app-amortization-chart',
  standalone: false,
  templateUrl: './amortization-chart.component.html',
  styleUrl: './amortization-chart.component.scss',
})
export class AmortizationChartComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() schedule: AmortizationRow[] = [];
  @ViewChild('chartCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  viewMode: 'monthly' | 'yearly' = 'yearly';
  tooltipVisible = false;
  tooltipX = 0;
  tooltipY = 0;
  tooltipTitle = '';
  tooltipPrincipal = '';
  tooltipInterest = '';
  tooltipTotal = '';

  private userOverride = false;
  private resizeObserver?: ResizeObserver;
  private barHits: BarHit[] = [];
  private hoveredKey: number | null = null;

  private readonly chartH = 300;
  private readonly pad = { l: 56, r: 16, t: 20, b: 36 };

  ngOnChanges(): void {
    if (!this.userOverride) {
      this.viewMode = this.schedule.length <= 24 ? 'monthly' : 'yearly';
    }
    this.draw();
  }

  ngAfterViewInit(): void {
    const parent = this.canvasRef.nativeElement.parentElement;
    if (parent && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.draw());
      this.resizeObserver.observe(parent);
    }
    this.draw();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.draw();
  }

  @HostListener('window:themechange')
  onThemeChange(): void {
    this.draw();
  }

  setViewMode(mode: 'monthly' | 'yearly'): void {
    if (this.viewMode === mode) return;
    this.userOverride = true;
    this.viewMode = mode;
    this.hideTooltip();
    this.draw();
  }

  onMouseMove(event: MouseEvent): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !this.barHits.length) return;

    const rect = canvas.getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;

    const hit = this.barHits.find(
      b => mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h,
    );

    if (!hit) {
      if (this.hoveredKey !== null) {
        this.hoveredKey = null;
        this.hideTooltip();
        this.draw();
      }
      return;
    }

    if (this.hoveredKey !== hit.key) {
      this.hoveredKey = hit.key;
      this.draw();
    }

    const total = hit.principal + hit.interest;
    const unit = this.viewMode === 'monthly' ? 'Μήνας' : 'Έτος';
    this.tooltipTitle = `${unit} ${hit.key}`;
    this.tooltipPrincipal = this.formatEuro(hit.principal);
    this.tooltipInterest = this.formatEuro(hit.interest);
    this.tooltipTotal = this.formatEuro(total);
    this.tooltipVisible = true;

    const container = canvas.parentElement!;
    const containerRect = container.getBoundingClientRect();
    let tx = event.clientX - containerRect.left + 12;
    let ty = event.clientY - containerRect.top - 12;
    tx = Math.min(tx, containerRect.width - 168);
    tx = Math.max(8, tx);
    ty = Math.max(8, ty);
    this.tooltipX = tx;
    this.tooltipY = ty;
  }

  onMouseLeave(): void {
    this.hoveredKey = null;
    this.hideTooltip();
    this.draw();
  }

  private hideTooltip(): void {
    this.tooltipVisible = false;
  }

  private draw(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    const W = canvas.parentElement?.clientWidth || 600;
    const H = this.chartH;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const buckets = this.buildBuckets();
    const keys = buckets.map(b => b.key);
    if (!keys.length) {
      this.barHits = [];
      return;
    }

    const maxVal = this.niceMax(Math.max(...buckets.map(b => b.principal + b.interest)));
    const theme = this.getTheme();
    const { l, r, t, b } = this.pad;
    const cW = W - l - r;
    const cH = H - t - b;
    const slotW = cW / keys.length;
    const bW = Math.max(4, Math.min(28, slotW * 0.72));

    this.barHits = [];
    this.drawGrid(ctx, W, H, maxVal, theme);

    buckets.forEach((bucket, i) => {
      const total = bucket.principal + bucket.interest;
      const x = l + i * slotW + (slotW - bW) / 2;
      const totalH = (total / maxVal) * cH;
      const principH = (bucket.principal / maxVal) * cH;
      const interestH = (bucket.interest / maxVal) * cH;
      const baseY = t + cH;
      const dimmed = this.hoveredKey !== null && this.hoveredKey !== bucket.key;

      ctx.globalAlpha = dimmed ? 0.35 : 1;

      if (interestH > 0) {
        ctx.fillStyle = this.hoveredKey === bucket.key ? theme.interestHover : theme.interest;
        this.fillBar(ctx, x, baseY - totalH, bW, interestH, principH <= 0);
      }
      if (principH > 0) {
        ctx.fillStyle = this.hoveredKey === bucket.key ? theme.principalHover : theme.principal;
        this.fillBar(ctx, x, baseY - principH, bW, principH, true);
      }

      ctx.globalAlpha = 1;

      this.barHits.push({
        key: bucket.key,
        x,
        y: baseY - totalH,
        w: bW,
        h: totalH,
        principal: bucket.principal,
        interest: bucket.interest,
      });

      if (this.shouldLabelTick(i, keys.length, bucket.key, keys)) {
        ctx.fillStyle = theme.axis;
        ctx.font = '11px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(bucket.key), x + bW / 2, H - 14);
      }
    });
  }

  private buildBuckets(): ChartBucket[] {
    const buckets: Record<number, ChartBucket> = {};

    for (const row of this.schedule) {
      const key = this.viewMode === 'monthly' ? row.month : Math.ceil(row.month / 12);
      if (!buckets[key]) buckets[key] = { key, principal: 0, interest: 0 };
      buckets[key].principal += row.principal + row.earlyAmt;
      buckets[key].interest += row.interest;
    }

    return Object.values(buckets).sort((a, b) => a.key - b.key);
  }

  private drawGrid(
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    maxVal: number,
    theme: ChartTheme,
  ): void {
    const { l, r, t, b } = this.pad;
    const cH = H - t - b;
    const steps = 4;

    for (let i = 0; i <= steps; i++) {
      const y = t + cH * (1 - i / steps);
      const val = (maxVal * i) / steps;

      ctx.strokeStyle = theme.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(l, y);
      ctx.lineTo(W - r, y);
      ctx.stroke();

      ctx.fillStyle = theme.label;
      ctx.font = '11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(this.formatAxis(val), l - 8, y + 4);
    }
  }

  private fillBar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    roundTop: boolean,
  ): void {
    if (h <= 0) return;
    const r = Math.min(3, w / 2, h / 2);
    ctx.beginPath();
    if (roundTop && h > r * 2) {
      ctx.moveTo(x, y + h);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h);
    } else {
      ctx.rect(x, y, w, h);
    }
    ctx.closePath();
    ctx.fill();
  }

  private shouldLabelTick(index: number, total: number, key: number, keys: number[]): boolean {
    if (index === 0 || index === total - 1) return true;
    let every: number;
    if (this.viewMode === 'monthly') {
      every = total <= 12 ? 1 : total <= 24 ? 2 : total <= 60 ? 6 : 12;
    } else {
      every = total <= 10 ? 1 : total <= 20 ? 2 : total <= 30 ? 3 : 5;
    }
    if (key % every === 0) return true;
    return keys[index + 1] !== undefined && keys[index + 1] - key > every;
  }

  private getTheme(): ChartTheme {
    const dark = document.documentElement.classList.contains('dark');
    return dark
      ? {
          grid: '#334155',
          axis: '#e2e8f0',
          label: '#94a3b8',
          principal: '#3b82f6',
          interest: '#f87171',
          principalHover: '#60a5fa',
          interestHover: '#fca5a5',
        }
      : {
          grid: '#e2e8f0',
          axis: '#475569',
          label: '#94a3b8',
          principal: '#2563eb',
          interest: '#dc2626',
          principalHover: '#1d4ed8',
          interestHover: '#b91c1c',
        };
  }

  private niceMax(value: number): number {
    if (value <= 0) return 1;
    const exp = Math.floor(Math.log10(value));
    const magnitude = Math.pow(10, exp);
    const norm = value / magnitude;
    const nice = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
    return nice * magnitude;
  }

  private formatAxis(value: number): string {
    if (value >= 1000) return `€${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
    return `€${Math.round(value)}`;
  }

  private formatEuro(value: number): string {
    return new Intl.NumberFormat('el-GR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
}
