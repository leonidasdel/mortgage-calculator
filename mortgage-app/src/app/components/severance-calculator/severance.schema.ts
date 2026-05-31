import { max, SchemaPathTree } from '@angular/forms/signals';
import { applyPayrollProfileFields } from '../../utils/calculator-schemas/payroll-profile.schema';
import { minZero } from '../../utils/calculator-schemas/common-validators';

export interface SeveranceModel {
  grossMonthly: number;
  yearsOfService: number;
  monthsExtra: number;
  terminationType: 'without_notice' | 'with_notice' | 'mutual';
}

export function severanceFormSchema(path: SchemaPathTree<SeveranceModel>): void {
  applyPayrollProfileFields(path);
  minZero(path.yearsOfService);
  minZero(path.monthsExtra);
  max(path.monthsExtra, 11);
}
