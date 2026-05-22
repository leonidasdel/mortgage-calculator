import { ChangeDetectionStrategy, Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

interface MonthOption {
  value: number;
  label: string;
}
@Component({
  selector: 'app-date-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './date-select.component.html',
  styleUrl: './date-select.component.scss',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => DateSelectComponent),
    multi: true,
  }],
})
export class DateSelectComponent implements ControlValueAccessor {
  @Input() minYear = 1980;
  @Input() maxYear = new Date().getFullYear();

  day = 1;
  month = 6;
  year = 2015;

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

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  get years(): number[] {
    const from = Math.min(this.minYear, this.maxYear);
    const to = Math.max(this.minYear, this.maxYear);
    return Array.from({ length: to - from + 1 }, (_, i) => to - i);
  }

  get days(): number[] {
    const max = new Date(this.year, this.month, 0).getDate();
    return Array.from({ length: max }, (_, i) => i + 1);
  }

  get displayDate(): string {
    const dd = String(this.day).padStart(2, '0');
    const mm = String(this.month).padStart(2, '0');
    return `${dd}/${mm}/${this.year}`;
  }

  writeValue(value: string | null): void {
    const iso = this.parseIso(value);
    if (!iso) return;
    this.year = iso.year;
    this.month = iso.month;
    this.day = iso.day;
    this.clampDay();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  onDayChange(event: Event): void {
    this.day = Number((event.target as HTMLSelectElement).value);
    this.emit();
  }

  onMonthChange(event: Event): void {
    this.month = Number((event.target as HTMLSelectElement).value);
    this.clampDay();
    this.emit();
  }

  onYearChange(event: Event): void {
    this.year = Number((event.target as HTMLSelectElement).value);
    this.clampDay();
    this.emit();
  }

  private emit(): void {
    const iso = `${this.year}-${String(this.month).padStart(2, '0')}-${String(this.day).padStart(2, '0')}`;
    this.onChange(iso);
    this.onTouched();
  }

  private clampDay(): void {
    const max = new Date(this.year, this.month, 0).getDate();
    if (this.day > max) this.day = max;
  }

  private parseIso(value: string | null | undefined): { year: number; month: number; day: number } | null {
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
