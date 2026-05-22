import { ChangeDetectionStrategy, Component, effect, input } from '@angular/core';
import { AmortizationRow } from '../../models/mortgage.models';
import { CommonModule } from '@angular/common';
import { EuroPipe } from '../../pipes/euro.pipe';
import { DateDDMMYYYYPipe } from '../../pipes/date-ddmmyyyy.pipe';

const PER_PAGE = 12;

@Component({
  selector: 'app-amortization-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, EuroPipe, DateDDMMYYYYPipe],
  templateUrl: './amortization-table.component.html',
  styleUrl: './amortization-table.component.scss',
})
export class AmortizationTableComponent {
  schedule = input<AmortizationRow[]>([]);

  page     = 1;
  showAll  = false;

  constructor() {
    effect(() => {
      this.schedule();
      this.page = 1;
    });
  }

  get totalPages(): number {
    return Math.ceil(this.schedule().length / PER_PAGE);
  }

  get visibleRows(): AmortizationRow[] {
    const sched = this.schedule();
    if (this.showAll) return sched;
    const start = (this.page - 1) * PER_PAGE;
    return sched.slice(start, start + PER_PAGE);
  }

  get rangeStart(): number { return (this.page - 1) * PER_PAGE + 1; }
  get rangeEnd(): number   { return Math.min(this.page * PER_PAGE, this.schedule().length); }

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
