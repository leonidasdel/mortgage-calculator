import { Component, Input } from '@angular/core';

export interface CompareRow {
  label: string;
  valueA: string;
  valueB: string;
  highlight?: 'a' | 'b';
}

@Component({
  selector: 'app-compare-panel',
  standalone: false,
  templateUrl: './compare-panel.component.html',
  styleUrl: './compare-panel.component.scss',
})
export class ComparePanelComponent {
  @Input() labelA = 'Σενάριο Α';
  @Input() labelB = 'Σενάριο Β';
  @Input() rows: CompareRow[] = [];
}
