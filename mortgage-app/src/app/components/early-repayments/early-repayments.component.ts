import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { BulkErParams, EarlyRepayment, ErMonthsSavedMap } from '../../models/mortgage.models';
import { CommonModule } from '@angular/common';
import { BulkErFormComponent } from '../bulk-er-form/bulk-er-form.component';

@Component({
  selector: 'app-early-repayments',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, BulkErFormComponent],
  templateUrl: './early-repayments.component.html',
  styleUrl: './early-repayments.component.scss',
})
export class EarlyRepaymentsComponent {
  erList = input<EarlyRepayment[]>([]);
  erMonthsSaved = input<ErMonthsSavedMap>({});
  scheduleLength = input(0);
  erMode = input<'reducePmt' | 'reduceDur'>('reducePmt');

  erListChange = output<EarlyRepayment[]>();
  erModeChange = output<'reducePmt' | 'reduceDur'>();

  showBulk = false;

  addER(): void {
    const list = this.erList();
    const next = [...list, { id: this.nextId(), month: 12, amount: 0 }];
    this.erListChange.emit(next);
  }

  removeER(id: number): void {
    this.erListChange.emit(this.erList().filter(e => e.id !== id));
  }

  updateERField(id: number, field: 'month' | 'amount', raw: string): void {
    const val = field === 'month'
      ? Math.max(1, Math.round(parseFloat(raw) || 1))
      : Math.max(0, parseFloat(raw) || 0);
    this.erListChange.emit(this.erList().map(e => e.id === id ? { ...e, [field]: val } : e));
  }

  clearAll(): void {
    this.erListChange.emit([]);
  }

  onBulkAdd(params: BulkErParams): void {
    const list = this.erList();
    const added: EarlyRepayment[] = [];
    let id = this.nextId();
    for (let i = 0; i < params.count; i++) {
      added.push({ id: id++, month: params.startMonth + i * params.every, amount: params.amount });
    }
    const merged = [...list, ...added].sort((a, b) => a.month - b.month);
    this.erListChange.emit(merged);
    this.showBulk = false;
  }

  isInactive(er: EarlyRepayment): boolean {
    const len = this.scheduleLength();
    return len > 0 && er.month > len;
  }

  monthsSavedLabel(er: EarlyRepayment): string {
    const ms = this.erMonthsSaved()[er.id] || 0;
    if (ms <= 0 || this.isInactive(er)) return '';
    const yrs = Math.floor(ms / 12);
    const mos = ms % 12;
    const parts: string[] = [];
    if (yrs > 0) parts.push(`${yrs} έτ${yrs === 1 ? 'ος' : 'η'}`);
    if (mos > 0) parts.push(`${mos} μήν${mos === 1 ? 'α' : 'ες'}`);
    return `↓ ${parts.join(' και ')} νωρίτερα`;
  }

  onErModeChange(value: 'reducePmt' | 'reduceDur'): void {
    this.erModeChange.emit(value);
  }

  private nextId(): number {
    const list = this.erList();
    return list.length > 0 ? Math.max(...list.map(e => e.id)) + 1 : 1;
  }
}
