import { Directive, output } from '@angular/core';

@Directive({
  selector: '[appChartResize]',
  host: {
    '(window:resize)': 'onResize()',
    '(window:themechange)': 'onResize()',
  },
})
export class ChartResizeDirective {
  chartResize = output<void>();

  onResize(): void {
    this.chartResize.emit();
  }
}
