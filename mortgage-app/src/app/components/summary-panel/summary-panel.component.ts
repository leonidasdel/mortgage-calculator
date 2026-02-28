import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LoanParams, MortgageSummary } from '../../models/mortgage.models';

@Component({
  selector: 'app-summary-panel',
  standalone: false,
  templateUrl: './summary-panel.component.html',
  styleUrl: './summary-panel.component.scss',
})
export class SummaryPanelComponent {
  @Input() summary!: MortgageSummary;
  @Input() params!: LoanParams;
  @Output() exportCsv = new EventEmitter<void>();

  get interestPct(): string {
    if (!this.params?.loanAmount || this.params.loanAmount <= 0) return '0';
    return (this.summary.totalInterest / this.params.loanAmount * 100).toFixed(1);
  }

  get fixedSubLabel(): string {
    if (!this.params) return '';
    const fy = this.params.fixedYears;
    const fr = this.params.fixedRate;
    const vr = this.summary.varRate;
    return fy > 0
      ? `Σταθερή για ${fy} έτ${fy === 1 ? 'ος' : 'η'} @ ${fr.toFixed(2)}%`
      : `Κυμαινόμενο επιτόκιο @ ${vr.toFixed(2)}%`;
  }

  get varSubLabel(): string {
    if (!this.params) return '';
    return `Κυμαινόμενο Euribor + ${this.params.bankMargin}% = ${this.summary.varRate.toFixed(2)}%`;
  }

  window_print(): void { window.print(); }

  get hasErSavings(): boolean {
    return (this.summary.interestSaved ?? 0) > 0 || (this.summary.monthsSaved ?? 0) > 0;
  }

  get savingsTimePart(): string {
    const ms = this.summary.monthsSaved || 0;
    if (ms <= 0) return '';
    const yrs = Math.floor(ms / 12);
    const rem = ms % 12;
    const parts: string[] = [];
    if (yrs > 0) parts.push(`${yrs} έτ${yrs === 1 ? 'ος' : 'η'}`);
    if (rem > 0) parts.push(`${rem} μήν${rem === 1 ? 'α' : 'ες'}`);
    return parts.join(' και ');
  }
}
