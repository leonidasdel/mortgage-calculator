import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
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
  @Input({ required: true }) result!: LeaveResult;
  @Input() situation: 'termination' | 'during_employment' = 'termination';
  @Input() includeHolidayBonus = false;
  @Input() taxYear = '2025';
  @Input() unusedDays = 0;
  @Input() showTaxBreakdown = false;
  @Input() shareState: Record<string, unknown> = {};
  @Input() shareSummary = '';

  @Output() toggleBreakdown = new EventEmitter<void>();
}
