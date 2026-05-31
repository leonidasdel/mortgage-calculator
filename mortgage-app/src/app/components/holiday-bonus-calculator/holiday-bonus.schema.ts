import { SchemaPathTree } from '@angular/forms/signals';
import {
  applyPayrollProfileFields,
  payrollChildrenCount,
} from '../../utils/calculator-schemas/payroll-profile.schema';
import { minZero } from '../../utils/calculator-schemas/common-validators';

export interface HolidayBonusModel {
  grossMonthly: number;
  year: number;
  ageGroup: string;
  children: number;
  partialEnabled: boolean;
  christmasMonthsWorked: number;
  easterMonthsWorked: number;
}

export function holidayBonusFormSchema(path: SchemaPathTree<HolidayBonusModel>): void {
  applyPayrollProfileFields(path);
  payrollChildrenCount(path.children);
  minZero(path.christmasMonthsWorked);
  minZero(path.easterMonthsWorked);
}
