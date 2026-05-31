import { max, SchemaPath, SchemaPathRules, SchemaPathTree } from '@angular/forms/signals';
import { minZero } from './common-validators';

/** Shared validators for salary-family calculators. */
export function payrollGrossMonthly(path: SchemaPath<number, SchemaPathRules.Supported>): void {
  minZero(path);
}

export function payrollChildrenCount(path: SchemaPath<number, SchemaPathRules.Supported>): void {
  minZero(path);
  max(path, 6);
}

export function applyPayrollProfileFields<T extends object>(path: SchemaPathTree<T>): void {
  const p = path as SchemaPathTree<{
    grossMonthly?: number;
    previousGross?: number;
    annualBonus?: number;
  }>;
  if (p.grossMonthly) payrollGrossMonthly(p.grossMonthly);
  if (p.previousGross) minZero(p.previousGross);
  if (p.annualBonus) minZero(p.annualBonus);
}
