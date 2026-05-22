import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LeaveResult } from '../../services/unused-leave-calculator.service';
import { CommonModule } from '@angular/common';
import { EuroPipe } from '../../pipes/euro.pipe';
import { ExportRowComponent } from '../export-row/export-row.component';

@Component({
  selector: 'app-unused-leave-tax-breakdown',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, EuroPipe, ExportRowComponent],
  templateUrl: './unused-leave-tax-breakdown.component.html',
  styleUrl: './unused-leave-tax-breakdown.component.scss',
})
export class UnusedLeaveTaxBreakdownComponent {
  result = input.required<LeaveResult>();
  situation = input<'termination' | 'during_employment'>('termination');
  includeHolidayBonus = input(false);
  taxYear = input('2025');
  unusedDays = input(0);
  showTaxBreakdown = input(false);
  shareState = input<object>({});
  shareSummary = input('');

  toggleBreakdown = output<void>();
}
