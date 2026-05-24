import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CompareRow {
  label: string;
  valueA: string;
  valueB: string;
  highlight?: 'a' | 'b';
}

@Component({
  selector: 'app-compare-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './compare-panel.component.html',
  styleUrl: './compare-panel.component.scss',
})
export class ComparePanelComponent {
  labelA = input('Σενάριο Α');
  labelB = input('Σενάριο Β');
  rows = input<CompareRow[]>([]);
}
