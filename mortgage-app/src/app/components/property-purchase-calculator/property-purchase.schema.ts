import { SchemaPathTree } from '@angular/forms/signals';
import { minZero } from '../../utils/calculator-schemas/common-validators';
import { payrollChildrenCount } from '../../utils/calculator-schemas/payroll-profile.schema';

export interface PropertyPurchaseModel {
  purchasePrice: number;
  aaotValue: number;
  isFirstHome: boolean;
  isMarried: boolean;
  children: number;
  includeAgent: boolean;
  includeLawyer: boolean;
}

export function propertyPurchaseFormSchema(path: SchemaPathTree<PropertyPurchaseModel>): void {
  minZero(path.purchasePrice);
  minZero(path.aaotValue);
  payrollChildrenCount(path.children);
}
