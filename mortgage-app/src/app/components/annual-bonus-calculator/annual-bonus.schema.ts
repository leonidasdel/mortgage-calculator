import { SchemaPathTree } from '@angular/forms/signals';
import { applyPayrollProfileFields } from '../../utils/calculator-schemas/payroll-profile.schema';

export interface AnnualBonusModel {
  grossMonthly: number;
  annualBonus: number;
  year: string;
  ageGroup: string;
  children: string;
  hasSalaryChange: boolean;
  salaryChangeMonth: string;
  previousGross: number;
}

export function annualBonusFormSchema(path: SchemaPathTree<AnnualBonusModel>): void {
  applyPayrollProfileFields(path);
}
