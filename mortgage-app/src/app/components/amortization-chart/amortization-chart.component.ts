import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  linkedSignal,
  OnDestroy,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChartResizeDirective } from '../../directives/chart-resize.directive';
import { AmortizationRow } from '../../models/mortgage.models';
import {
  AmortizationChartTheme,
  drawHorizontalGrid,
  formatAxisEuro,
  getChartTheme,
  isDarkTheme,
  niceMax,
  setupCanvas,
} from '../../utils/chart-canvas.util';

/** Monthly bar view only makes sense for short loans */
const MAX_MONTHLY_BUCKETS = 60;
/** Beyond this, stacked area renders instead of bars */
const BAR_MODE_MAX_BUCKETS = 48;

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

interface ChartTooltip {
  visible: boolean;
  x: number;
  y: number;
  title: string;
  principal: string;
  interest: string;
  total: string;
}

const HIDDEN_TOOLTIP: ChartTooltip = {
  visible: false,
  x: 0,
  y: 0,
  title: '',
  principal: '',
  interest: '',
  total: '',
};

@Component({
  selector: 'app-amortization-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ChartResizeDirective],
  templateUrl: './amortization-chart.component.html',
  styleUrl: './amortization-chart.component.scss',
})
export class AmortizationChartComponent implements AfterViewInit, OnDestroy {
  schedule = input<AmortizationRow[]>([]);
  canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('chartCanvas');

  private readonly userOverride = signal(false);
  monthlyAllowed = computed(() => this.schedule().length <= MAX_MONTHLY_BUCKETS);

  viewMode = linkedSignal<{ allowed: boolean }, 'monthly' | 'yearly'>({
    source: () => ({ allowed: this.monthlyAllowed() }),
    computation: (src, prev) => {
      if (!this.userOverride()) {
        return src.allowed ? 'monthly' : 'yearly';
      }
      const mode = prev?.value ?? 'yearly';
      return mode === 'monthly' && !src.allowed ? 'yearly' : mode;
    },
  });

  tooltip = signal<ChartTooltip>(HIDDEN_TOOLTIP);

  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private resizeObserver?: ResizeObserver;
  private barHits: BarHit[] = [];
  private hoveredKey: number | null = null;

  private readonly chartH = 300;
  private readonly pad = { l: 56, r: 16, t: 20, b: 36 };

  constructor() {
    effect(() => {
      this.schedule();
      this.viewMode();
      if (this.isBrowser) {
        this.draw();
      }
    });
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    const canvas = this.canvasRef().nativeElement;
    const parent = canvas.parentElement;
    if (parent && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.draw());
      this.resizeObserver.observe(parent);
    }
    this.draw();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  onChartResize(): void {
    this.draw();
  }

  setViewMode(mode: 'monthly' | 'yearly'): void {
    if (mode === 'monthly' && !this.monthlyAllowed()) return;
    if (this.viewMode() === mode) return;
    this.userOverride.set(true);
    this.viewMode.set(mode);
    this.hideTooltip();
    this.draw();
  }

  onMouseMove(event: MouseEvent): void {
    const canvas = this.canvasRef().nativeElement;
    if (!this.barHits.length) return;

    const rect = canvas.getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;

    const hit =
      this.barHits.reduce<BarHit | null>((best, b) => {
        if (mx < b.x || mx > b.x + b.w) return best;
        if (my < b.y || my > b.y + b.h) return best;
        return b;
      }, null) ?? this.nearestHit(mx);

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

    this.showTooltip(hit, event);
  }

  onMouseLeave(): void {
    this.hoveredKey = null;
    this.hideTooltip();
    this.draw();
  }

  private nearestHit(mx: number): BarHit | null {
    if (!this.barHits.length) return null;
    return this.barHits.reduce((best, b) => {
      const cx = b.x + b.w / 2;
      const bestCx = best.x + best.w / 2;
      return Math.abs(mx - cx) < Math.abs(mx - bestCx) ? b : best;
    });
  }

  private showTooltip(hit: BarHit, event: MouseEvent): void {
    const total = hit.principal + hit.interest;
    const unit = this.viewMode() === 'monthly' ? 'Μήνας' : 'Έτος';

    const canvas = this.canvasRef().nativeElement;
    const container = canvas.parentElement!;
    const containerRect = container.getBoundingClientRect();
    let tx = event.clientX - containerRect.left + 12;
    let ty = event.clientY - containerRect.top - 12;
    tx = Math.min(tx, containerRect.width - 168);
    tx = Math.max(8, tx);
    ty = Math.max(8, ty);

    this.tooltip.set({
      visible: true,
      x: tx,
      y: ty,
      title: `${unit} ${hit.key}`,
      principal: this.formatEuro(hit.principal),
      interest: this.formatEuro(hit.interest),
      total: this.formatEuro(total),
    });
  }

  private hideTooltip(): void {
    this.tooltip.set(HIDDEN_TOOLTIP);
  }

  private draw(): void {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return;

    const W = canvas.parentElement?.clientWidth || 600;
    const H = this.chartH;
    const ctx = setupCanvas(canvas, W, H, true);
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    const buckets = this.buildBuckets();
    if (!buckets.length) {
      this.barHits = [];
      return;
    }

    const maxVal = niceMax(Math.max(...buckets.map((b) => b.principal + b.interest)));
    const theme = getChartTheme(isDarkTheme());
    const { l, r, t, b } = this.pad;
    const cW = W - l - r;
    const cH = H - t - b;
    const slotW = cW / buckets.length;

    this.barHits = [];
    drawHorizontalGrid(ctx, W, H, maxVal, this.pad, theme.grid, theme.label, formatAxisEuro);

    if (buckets.length > BAR_MODE_MAX_BUCKETS) {
      this.drawAreaChart(ctx, buckets, W, H, maxVal, theme, slotW, cH);
    } else {
      this.drawBarChart(ctx, buckets, W, H, maxVal, theme, slotW, cH);
    }
  }

  private drawBarChart(
    ctx: CanvasRenderingContext2D,
    buckets: ChartBucket[],
    W: number,
    H: number,
    maxVal: number,
    theme: AmortizationChartTheme,
    slotW: number,
    cH: number,
  ): void {
    const { l, t } = this.pad;
    const bW = Math.max(2, Math.min(28, slotW * 0.72));
    const keys = buckets.map((bk) => bk.key);

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

  private drawAreaChart(
    ctx: CanvasRenderingContext2D,
    buckets: ChartBucket[],
    W: number,
    H: number,
    maxVal: number,
    theme: AmortizationChartTheme,
    slotW: number,
    cH: number,
  ): void {
    const { l, t } = this.pad;
    const baseY = t + cH;
    const keys = buckets.map((bk) => bk.key);

    const pts = buckets.map((bucket, i) => {
      const x = l + (i + 0.5) * slotW;
      const total = bucket.principal + bucket.interest;
      const totalH = (total / maxVal) * cH;
      const principH = (bucket.principal / maxVal) * cH;
      return {
        bucket,
        x,
        totalY: baseY - totalH,
        principY: baseY - principH,
      };
    });

    const dimmed = this.hoveredKey !== null;

    ctx.globalAlpha = dimmed ? 0.25 : 0.9;
    ctx.fillStyle = theme.interestFill;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].principY);
    pts.forEach((p) => ctx.lineTo(p.x, p.totalY));
    for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i].x, pts[i].principY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = theme.principalFill;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, baseY);
    pts.forEach((p) => ctx.lineTo(p.x, p.principY));
    for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i].x, baseY);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 1;

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = theme.interest;
    ctx.beginPath();
    pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.totalY) : ctx.lineTo(p.x, p.totalY)));
    ctx.stroke();

    ctx.strokeStyle = theme.principal;
    ctx.beginPath();
    pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.principY) : ctx.lineTo(p.x, p.principY)));
    ctx.stroke();

    if (this.hoveredKey !== null) {
      const hi = pts.find((p) => p.bucket.key === this.hoveredKey);
      if (hi) {
        ctx.strokeStyle = theme.axis;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(hi.x, t);
        ctx.lineTo(hi.x, baseY);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    pts.forEach((p, i) => {
      const totalH = baseY - p.totalY;
      this.barHits.push({
        key: p.bucket.key,
        x: l + i * slotW,
        y: p.totalY,
        w: slotW,
        h: totalH,
        principal: p.bucket.principal,
        interest: p.bucket.interest,
      });

      if (this.shouldLabelTick(i, keys.length, p.bucket.key, keys)) {
        ctx.fillStyle = theme.axis;
        ctx.font = '11px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(p.bucket.key), p.x, H - 14);
      }
    });
  }

  private buildBuckets(): ChartBucket[] {
    const buckets: Record<number, ChartBucket> = {};

    for (const row of this.schedule()) {
      const key = this.viewMode() === 'monthly' ? row.month : Math.ceil(row.month / 12);
      if (!buckets[key]) buckets[key] = { key, principal: 0, interest: 0 };
      buckets[key].principal += row.principal + row.earlyAmt;
      buckets[key].interest += row.interest;
    }

    return Object.values(buckets).sort((a, b) => a.key - b.key);
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
    if (this.viewMode() === 'monthly') {
      every = total <= 12 ? 1 : total <= 24 ? 2 : total <= 60 ? 6 : 12;
    } else {
      every = total <= 10 ? 1 : total <= 20 ? 2 : total <= 30 ? 3 : 5;
    }
    if (key % every === 0) return true;
    return keys[index + 1] !== undefined && keys[index + 1] - key > every;
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
