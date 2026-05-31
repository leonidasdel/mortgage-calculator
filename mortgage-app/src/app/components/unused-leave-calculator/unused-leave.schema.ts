import { SchemaPathTree } from '@angular/forms/signals';
import {
  applyPayrollProfileFields,
  payrollChildrenCount,
} from '../../utils/calculator-schemas/payroll-profile.schema';
import { minZero } from '../../utils/calculator-schemas/common-validators';

export interface UnusedLeaveModel {
  salaryType: 'monthly' | 'daily';
  grossMonthly: number;
  dailyWage: number;
  workWeek: '5day' | '6day';
  unusedDays: number;
  includeHolidayBonus: boolean;
  situation: 'termination' | 'during_employment';
  taxYear: '2025' | '2026';
  ageGroup: string;
  children: number;
  useCustomAnnualIncome: boolean;
  customAnnualGross: number;
}

export function unusedLeaveFormSchema(path: SchemaPathTree<UnusedLeaveModel>): void {
  applyPayrollProfileFields(path);
  payrollChildrenCount(path.children);
  minZero(path.dailyWage);
  minZero(path.unusedDays);
  minZero(path.customAnnualGross);
}
