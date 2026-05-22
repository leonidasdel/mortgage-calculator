import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LoanParams, MortgageSummary } from '../../models/mortgage.models';
import { CommonModule } from '@angular/common';
import { EuroPipe } from '../../pipes/euro.pipe';

@Component({
  selector: 'app-summary-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, EuroPipe],
  templateUrl: './summary-panel.component.html',
  styleUrl: './summary-panel.component.scss',
})
export class SummaryPanelComponent {
  summary = input.required<MortgageSummary>();
  params = input.required<LoanParams>();
  exportCsv = output<void>();

  get interestPct(): string {
    const p = this.params();
    const s = this.summary();
    if (!p?.loanAmount || p.loanAmount <= 0) return '0';
    return (s.totalInterest / p.loanAmount * 100).toFixed(1);
  }

  get fixedSubLabel(): string {
    const p = this.params();
    const s = this.summary();
    if (!p) return '';
    const fy = p.fixedYears;
    const fr = p.fixedRate;
    const vr = s.varRate;
    return fy > 0
      ? `Σταθερή για ${fy} έτ${fy === 1 ? 'ος' : 'η'} @ ${fr.toFixed(2)}%`
      : `Κυμαινόμενο επιτόκιο @ ${vr.toFixed(2)}%`;
  }

  get varSubLabel(): string {
    const p = this.params();
    const s = this.summary();
    if (!p) return '';
    return `Κυμαινόμενο Euribor + ${p.bankMargin}% = ${s.varRate.toFixed(2)}%`;
  }

  window_print(): void { window.print(); }

  get hasErSavings(): boolean {
    const s = this.summary();
    return (s.interestSaved ?? 0) > 0 || (s.monthsSaved ?? 0) > 0;
  }

  get savingsTimePart(): string {
    const s = this.summary();
    const ms = s.monthsSaved || 0;
    if (ms <= 0) return '';
    const yrs = Math.floor(ms / 12);
    const rem = ms % 12;
    const parts: string[] = [];
    if (yrs > 0) parts.push(`${yrs} έτ${yrs === 1 ? 'ος' : 'η'}`);
    if (rem > 0) parts.push(`${rem} μήν${rem === 1 ? 'α' : 'ες'}`);
    return parts.join(' και ');
  }
}
