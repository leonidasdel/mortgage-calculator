import { ChangeDetectionStrategy, Component, computed, effect, input, model } from '@angular/core';
import { CommonModule } from '@angular/common';

interface MonthOption {
  value: number;
  label: string;
}

@Component({
  selector: 'app-date-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './date-select.component.html',
  styleUrl: './date-select.component.scss',
})
export class DateSelectComponent {
  minYear = input(1980);
  maxYear = input(new Date().getFullYear());
  value = model<string>('2015-06-01');

  readonly months: MonthOption[] = [
    { value: 1, label: 'Ιανουάριος' },
    { value: 2, label: 'Φεβρουάριος' },
    { value: 3, label: 'Μάρτιος' },
    { value: 4, label: 'Απρίλιος' },
    { value: 5, label: 'Μάιος' },
    { value: 6, label: 'Ιούνιος' },
    { value: 7, label: 'Ιούλιος' },
    { value: 8, label: 'Αύγουστος' },
    { value: 9, label: 'Σεπτέμβριος' },
    { value: 10, label: 'Οκτώβριος' },
    { value: 11, label: 'Νοέμβριος' },
    { value: 12, label: 'Δεκέμβριος' },
  ];

  private readonly parts = computed(
    () => this.parseIso(this.value()) ?? { year: 2015, month: 6, day: 1 },
  );

  years = computed(() => {
    const min = this.minYear();
    const max = this.maxYear();
    const from = Math.min(min, max);
    const to = Math.max(min, max);
    return Array.from({ length: to - from + 1 }, (_, i) => to - i);
  });

  days = computed(() => {
    const { year, month } = this.parts();
    const max = new Date(year, month, 0).getDate();
    return Array.from({ length: max }, (_, i) => i + 1);
  });

  displayDate = computed(() => {
    const { day, month, year } = this.parts();
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  });

  day = computed(() => this.parts().day);
  month = computed(() => this.parts().month);
  year = computed(() => this.parts().year);

  constructor() {
    effect(() => {
      const iso = this.value();
      const parsed = this.parseIso(iso);
      if (!parsed) return;
      const clamped = this.clampDay(parsed.year, parsed.month, parsed.day);
      const next = `${clamped.year}-${String(clamped.month).padStart(2, '0')}-${String(clamped.day).padStart(2, '0')}`;
      if (next !== iso) this.value.set(next);
    });
  }

  onDayChange(event: Event): void {
    this.emitWith({ day: Number((event.target as HTMLSelectElement).value) });
  }

  onMonthChange(event: Event): void {
    const month = Number((event.target as HTMLSelectElement).value);
    const { year, day } = this.parts();
    const clamped = this.clampDay(year, month, day);
    this.emitIso(clamped.year, clamped.month, clamped.day);
  }

  onYearChange(event: Event): void {
    const year = Number((event.target as HTMLSelectElement).value);
    const { month, day } = this.parts();
    const clamped = this.clampDay(year, month, day);
    this.emitIso(clamped.year, clamped.month, clamped.day);
  }

  private emitWith(partial: { day?: number; month?: number; year?: number }): void {
    const cur = this.parts();
    const year = partial.year ?? cur.year;
    const month = partial.month ?? cur.month;
    const day = partial.day ?? cur.day;
    const clamped = this.clampDay(year, month, day);
    this.emitIso(clamped.year, clamped.month, clamped.day);
  }

  private emitIso(year: number, month: number, day: number): void {
    this.value.set(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  }

  private clampDay(
    year: number,
    month: number,
    day: number,
  ): { year: number; month: number; day: number } {
    const max = new Date(year, month, 0).getDate();
    return { year, month, day: Math.min(day, max) };
  }

  private parseIso(
    value: string | null | undefined,
  ): { year: number; month: number; day: number } | null {
    if (!value) return null;
    const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) {
      return { year: Number(iso[1]), month: Number(iso[2]), day: Number(iso[3]) };
    }
    const gr = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (gr) {
      return { year: Number(gr[3]), month: Number(gr[2]), day: Number(gr[1]) };
    }
    return null;
  }
}
