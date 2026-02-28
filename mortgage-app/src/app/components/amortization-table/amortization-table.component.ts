import { Component, Input, OnChanges } from '@angular/core';
import { AmortizationRow } from '../../models/mortgage.models';

const PER_PAGE = 12;

@Component({
  selector: 'app-amortization-table',
  standalone: false,
  templateUrl: './amortization-table.component.html',
  styleUrl: './amortization-table.component.scss',
})
export class AmortizationTableComponent implements OnChanges {
  @Input() schedule: AmortizationRow[] = [];

  page     = 1;
  showAll  = false;

  ngOnChanges(): void {
    this.page = 1;
  }

  get totalPages(): number {
    return Math.ceil(this.schedule.length / PER_PAGE);
  }

  get visibleRows(): AmortizationRow[] {
    if (this.showAll) return this.schedule;
    const start = (this.page - 1) * PER_PAGE;
    return this.schedule.slice(start, start + PER_PAGE);
  }

  get rangeStart(): number { return (this.page - 1) * PER_PAGE + 1; }
  get rangeEnd(): number   { return Math.min(this.page * PER_PAGE, this.schedule.length); }

  toggleShowAll(): void {
    this.showAll = !this.showAll;
    this.page = 1;
  }

  prevPage(): void { if (this.page > 1) this.page--; }
  nextPage(): void { if (this.page < this.totalPages) this.page++; }

  rowClass(r: AmortizationRow): string {
    if (r.earlyAmt > 0) return 'early-row';
    if (r.isGrace)      return 'grace-row';
    if (!r.isFixed)     return 'variable-row';
    return '';
  }
}
