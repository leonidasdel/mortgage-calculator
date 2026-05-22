import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SalaryResult } from '../../models/salary.models';
import { DecimalPipe } from '@angular/common';
import { EuroPipe } from '../../pipes/euro.pipe';

@Component({
  selector: 'app-salary-payslip-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, EuroPipe],
  templateUrl: './salary-payslip-panel.component.html',
  styleUrl: './salary-payslip-panel.component.scss',
})
export class SalaryPayslipPanelComponent {
  result = input.required<SalaryResult>();
  ftePercent = input(100);
  raiseDiff = input<{ monthly: number; annual: number } | null>(null);
}
