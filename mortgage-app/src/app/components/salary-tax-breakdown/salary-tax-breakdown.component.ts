import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MultiEmployerResult, SalaryResult } from '../../models/salary.models';
import { DecimalPipe } from '@angular/common';
import { EuroPipe } from '../../pipes/euro.pipe';
import { CalcExplanationComponent } from '../calc-explanation/calc-explanation.component';
import { ExportRowComponent } from '../export-row/export-row.component';
import { LawFooterComponent } from '../law-footer/law-footer.component';

@Component({
  selector: 'app-salary-tax-breakdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    EuroPipe,
    CalcExplanationComponent,
    ExportRowComponent,
    LawFooterComponent,
  ],
  templateUrl: './salary-tax-breakdown.component.html',
  styleUrl: './salary-tax-breakdown.component.scss',
})
export class SalaryTaxBreakdownComponent {
  result = input.required<SalaryResult>();
  year = input(2026);
  ageGroupLabel = input('');
  showTaxDetails = input(false);
  fullTimeResult = input<SalaryResult | null>(null);
  multiEmployerResult = input<MultiEmployerResult | null>(null);
  shareState = input<Record<string, unknown>>({});
  shareSummary = input('');

  toggleDetails = output<void>();
  exportPayslip = output<void>();
}
