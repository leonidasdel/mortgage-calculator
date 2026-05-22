import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MultiEmployerResult, SalaryResult } from '../../models/salary.models';

@Component({
  selector: 'app-salary-tax-breakdown',
  standalone: false,
  templateUrl: './salary-tax-breakdown.component.html',
  styleUrl: './salary-tax-breakdown.component.scss',
})
export class SalaryTaxBreakdownComponent {
  @Input({ required: true }) result!: SalaryResult;
  @Input() year = 2026;
  @Input() ageGroupLabel = '';
  @Input() showTaxDetails = false;
  @Input() fullTimeResult: SalaryResult | null = null;
  @Input() multiEmployerResult: MultiEmployerResult | null = null;
  @Input() shareState: Record<string, unknown> = {};
  @Input() shareSummary = '';

  @Output() toggleDetails = new EventEmitter<void>();
  @Output() exportPayslip = new EventEmitter<void>();
}
