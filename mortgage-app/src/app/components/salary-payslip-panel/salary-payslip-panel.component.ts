import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SalaryResult } from '../../models/salary.models';

import { CommonModule } from '@angular/common';
import { EuroPipe } from '../../pipes/euro.pipe';
@Component({
  selector: 'app-salary-payslip-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, EuroPipe],
  templateUrl: './salary-payslip-panel.component.html',
  styleUrl: './salary-payslip-panel.component.scss',
})
export class SalaryPayslipPanelComponent {
  @Input({ required: true }) result!: SalaryResult;
  @Input() ftePercent = 100;
  @Input() raiseDiff: { monthly: number; annual: number } | null = null;
}
