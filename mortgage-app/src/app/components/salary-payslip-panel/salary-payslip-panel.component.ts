import { Component, Input } from '@angular/core';
import { SalaryResult } from '../../models/salary.models';

@Component({
  selector: 'app-salary-payslip-panel',
  standalone: false,
  templateUrl: './salary-payslip-panel.component.html',
  styleUrl: './salary-payslip-panel.component.scss',
})
export class SalaryPayslipPanelComponent {
  @Input({ required: true }) result!: SalaryResult;
  @Input() ftePercent = 100;
  @Input() raiseDiff: { monthly: number; annual: number } | null = null;
}
