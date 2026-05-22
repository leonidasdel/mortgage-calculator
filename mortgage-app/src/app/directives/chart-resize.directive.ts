import { Directive, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[appChartResize]',
  standalone: false,
})
export class ChartResizeDirective {
  @Output() chartResize = new EventEmitter<void>();

  @HostListener('window:resize')
  @HostListener('window:themechange')
  onResize(): void {
    this.chartResize.emit();
  }
}
