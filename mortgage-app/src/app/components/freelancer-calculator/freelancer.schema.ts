import { SchemaPathTree } from '@angular/forms/signals';
import { minZero } from '../../utils/calculator-schemas/common-validators';

export interface FreelancerModel {
  annualRevenue: number;
  annualExpenses: number;
  efkaCategory: string;
  yearsActive: string;
  ageGroup: string;
  children: string;
}

export function freelancerFormSchema(path: SchemaPathTree<FreelancerModel>): void {
  minZero(path.annualRevenue);
  minZero(path.annualExpenses);
}
