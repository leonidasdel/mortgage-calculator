import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BulkErParams, EarlyRepayment, ErMonthsSavedMap } from '../../models/mortgage.models';

@Component({
  selector: 'app-early-repayments',
  standalone: false,
  templateUrl: './early-repayments.component.html',
  styleUrl: './early-repayments.component.scss',
})
export class EarlyRepaymentsComponent {
  @Input() erList:        EarlyRepayment[]  = [];
  @Input() erMonthsSaved: ErMonthsSavedMap  = {};
  @Input() scheduleLength = 0;
  @Input() erMode: 'reducePmt' | 'reduceDur' = 'reducePmt';

  @Output() erListChange = new EventEmitter<EarlyRepayment[]>();
  @Output() erModeChange = new EventEmitter<'reducePmt' | 'reduceDur'>();

  showBulk = false;

  addER(): void {
    const next = [...this.erList, { id: this.nextId(), month: 12, amount: 0 }];
    this.erListChange.emit(next);
  }

  removeER(id: number): void {
    this.erListChange.emit(this.erList.filter(e => e.id !== id));
  }

  updateERField(id: number, field: 'month' | 'amount', raw: string): void {
    const val = field === 'month'
      ? Math.max(1, Math.round(parseFloat(raw) || 1))
      : Math.max(0, parseFloat(raw) || 0);
    this.erListChange.emit(this.erList.map(e => e.id === id ? { ...e, [field]: val } : e));
  }

  clearAll(): void {
    this.erListChange.emit([]);
  }

  onBulkAdd(params: BulkErParams): void {
    const added: EarlyRepayment[] = [];
    let id = this.nextId();
    for (let i = 0; i < params.count; i++) {
      added.push({ id: id++, month: params.startMonth + i * params.every, amount: params.amount });
    }
    const merged = [...this.erList, ...added].sort((a, b) => a.month - b.month);
    this.erListChange.emit(merged);
    this.showBulk = false;
  }

  isInactive(er: EarlyRepayment): boolean {
    return this.scheduleLength > 0 && er.month > this.scheduleLength;
  }

  monthsSavedLabel(er: EarlyRepayment): string {
    const ms = this.erMonthsSaved[er.id] || 0;
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
    return this.erList.length > 0 ? Math.max(...this.erList.map(e => e.id)) + 1 : 1;
  }
}
