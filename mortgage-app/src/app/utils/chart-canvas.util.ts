export interface AmortizationChartTheme {
  grid: string;
  axis: string;
  label: string;
  principal: string;
  interest: string;
  principalFill: string;
  interestFill: string;
  principalHover: string;
  interestHover: string;
}

export interface SavingsChartTheme {
  grid: string;
  label: string;
  axis: string;
  gains: string;
  contribution: string;
}

export interface ChartPadding {
  l: number;
  r: number;
  t: number;
  b: number;
}

export function isDarkTheme(): boolean {
  return document.documentElement.classList.contains('dark');
}

export function getChartTheme(isDark: boolean): AmortizationChartTheme {
  return isDark
    ? {
        grid: '#334155',
        axis: '#e2e8f0',
        label: '#94a3b8',
        principal: '#60a5fa',
        interest: '#f87171',
        principalFill: 'rgba(59, 130, 246, 0.35)',
        interestFill: 'rgba(248, 113, 113, 0.35)',
        principalHover: '#93c5fd',
        interestHover: '#fca5a5',
      }
    : {
        grid: '#e2e8f0',
        axis: '#475569',
        label: '#94a3b8',
        principal: '#2563eb',
        interest: '#dc2626',
        principalFill: 'rgba(37, 99, 235, 0.25)',
        interestFill: 'rgba(220, 38, 38, 0.22)',
        principalHover: '#1d4ed8',
        interestHover: '#b91c1c',
      };
}

export function getSavingsChartTheme(isDark: boolean): SavingsChartTheme {
  return isDark
    ? {
        grid: '#64748b',
        label: '#cbd5e1',
        axis: '#e2e8f0',
        gains: '#86efac',
        contribution: '#60a5fa',
      }
    : {
        grid: '#f3f4f6',
        label: '#9ca3af',
        axis: '#6b7280',
        gains: '#059669',
        contribution: '#1d4ed8',
      };
}

export function niceMax(value: number): number {
  if (value <= 0) return 1;
  const exp = Math.floor(Math.log10(value));
  const magnitude = Math.pow(10, exp);
  const norm = value / magnitude;
  const nice = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return nice * magnitude;
}

export function formatAxisEuro(value: number): string {
  if (value >= 1000) return `€${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return `€${Math.round(value)}`;
}

export function formatSavingsAxis(value: number): string {
  const lbl = value >= 1000 ? (value / 1000).toFixed(0) + 'K' : value.toFixed(0);
  return '€' + lbl;
}

export function setupCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  useDpr = false,
): CanvasRenderingContext2D | null {
  const dpr = useDpr ? window.devicePixelRatio || 1 : 1;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  if (useDpr) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

export function drawHorizontalGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  maxVal: number,
  pad: ChartPadding,
  gridColor: string,
  labelColor: string,
  formatLabel: (val: number) => string,
  steps = 4,
  font = '11px Inter, system-ui, sans-serif',
): void {
  const cH = height - pad.t - pad.b;

  for (let i = 0; i <= steps; i++) {
    const y = pad.t + cH * (1 - i / steps);
    const val = (maxVal * i) / steps;

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(width - pad.r, y);
    ctx.stroke();

    ctx.fillStyle = labelColor;
    ctx.font = font;
    ctx.textAlign = 'right';
    ctx.fillText(formatLabel(val), pad.l - 8, y + 4);
  }
}
