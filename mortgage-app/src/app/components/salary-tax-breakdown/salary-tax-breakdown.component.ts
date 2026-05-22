import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MultiEmployerResult, SalaryResult } from '../../models/salary.models';

import { CommonModule } from '@angular/common';
import { EuroPipe } from '../../pipes/euro.pipe';
import { CalcExplanationComponent } from '../calc-explanation/calc-explanation.component';
import { ExportRowComponent } from '../export-row/export-row.component';
import { LawFooterComponent } from '../law-footer/law-footer.component';
@Component({
  selector: 'app-salary-tax-breakdown',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, EuroPipe, CalcExplanationComponent, ExportRowComponent, LawFooterComponent],
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
