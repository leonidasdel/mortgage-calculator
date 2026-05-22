import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export interface CompareRow {
  label: string;
  valueA: string;
  valueB: string;
  highlight?: 'a' | 'b';
}

import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-compare-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './compare-panel.component.html',
  styleUrl: './compare-panel.component.scss',
})
export class ComparePanelComponent {
  @Input() labelA = 'Σενάριο Α';
  @Input() labelB = 'Σενάριο Β';
  @Input() rows: CompareRow[] = [];
}
