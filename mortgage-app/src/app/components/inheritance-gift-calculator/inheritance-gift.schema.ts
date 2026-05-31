import { SchemaPathTree } from '@angular/forms/signals';
import { minZero } from '../../utils/calculator-schemas/common-validators';

export interface InheritanceGiftModel {
  transferType: string;
  category: string;
  value: number;
  hasDisability: boolean;
  applyPrimaryResidenceInfo: boolean;
}

export function inheritanceGiftFormSchema(path: SchemaPathTree<InheritanceGiftModel>): void {
  minZero(path.value);
}
