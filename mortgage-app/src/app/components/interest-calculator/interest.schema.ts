import { SchemaPathTree } from '@angular/forms/signals';
import { minZero, pctRange } from '../../utils/calculator-schemas/common-validators';

export interface InterestModel {
  capital: number;
  rate: number;
  startDate: string;
  endDate: string;
}

export function interestFormSchema(path: SchemaPathTree<InterestModel>): void {
  minZero(path.capital);
  pctRange(path.rate);
}
