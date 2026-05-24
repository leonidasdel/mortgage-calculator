import { ChangeDetectionStrategy, Component, computed, input, linkedSignal, signal } from '@angular/core';
import { AmortizationRow } from '../../models/mortgage.models';
import { CommonModule } from '@angular/common';
import { EuroPipe } from '../../pipes/euro.pipe';
import { DateDDMMYYYYPipe } from '../../pipes/date-ddmmyyyy.pipe';

const PER_PAGE = 12;

@Component({
  selector: 'app-amortization-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, EuroPipe, DateDDMMYYYYPipe],
  templateUrl: './amortization-table.component.html',
  styleUrl: './amortization-table.component.scss',
})
export class AmortizationTableComponent {
  schedule = input<AmortizationRow[]>([]);

  showAll = signal(false);
  page = linkedSignal<AmortizationRow[], number>({
    source: this.schedule,
    computation: () => 1,
  });

  totalPages = computed(() => Math.ceil(this.schedule().length / PER_PAGE));

  visibleRows = computed(() => {
    const sched = this.schedule();
    if (this.showAll()) return sched;
    const start = (this.page() - 1) * PER_PAGE;
    return sched.slice(start, start + PER_PAGE);
  });

  rangeStart = computed(() => (this.page() - 1) * PER_PAGE + 1);
  rangeEnd = computed(() => Math.min(this.page() * PER_PAGE, this.schedule().length));

  toggleShowAll(): void {
    this.showAll.update(v => !v);
    this.page.set(1);
  }

  prevPage(): void {
    if (this.page() > 1) this.page.update(p => p - 1);
  }

  nextPage(): void {
    if (this.page() < this.totalPages()) this.page.update(p => p + 1);
  }

  rowClass(r: AmortizationRow): string {
    if (r.earlyAmt > 0) return 'early-row';
    if (r.isGrace) return 'grace-row';
    if (!r.isFixed) return 'variable-row';
    return '';
  }
}
