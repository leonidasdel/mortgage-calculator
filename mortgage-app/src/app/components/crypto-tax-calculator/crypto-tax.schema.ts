import { SchemaPathTree } from '@angular/forms/signals';
import { minZero } from '../../utils/calculator-schemas/common-validators';

export interface CryptoTaxModel {
  mode: string;
  totalProceeds: number;
  totalCost: number;
  carriedLoss: number;
  isProfessional: boolean;
}

export function cryptoTaxFormSchema(path: SchemaPathTree<CryptoTaxModel>): void {
  minZero(path.totalProceeds);
  minZero(path.totalCost);
  minZero(path.carriedLoss);
}
