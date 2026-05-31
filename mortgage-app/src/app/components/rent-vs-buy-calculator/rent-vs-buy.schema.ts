import { hidden, SchemaPathTree } from '@angular/forms/signals';
import { minZero, pctRange } from '../../utils/calculator-schemas/common-validators';
import { RentVsBuyModel } from './rent-vs-buy.store';

export function rentVsBuyFormSchema(path: SchemaPathTree<RentVsBuyModel>): void {
  minZero(path.propertyPrice);
  minZero(path.downPaymentAmount);
  minZero(path.closingCostsAmount);
  pctRange(path.downPaymentPct);
  minZero(path.closingCostsPct);

  hidden(path.downPaymentPct, ({ valueOf }) => valueOf(path.downPaymentMode) === 'amount');
  hidden(path.downPaymentAmount, ({ valueOf }) => valueOf(path.downPaymentMode) !== 'amount');
  hidden(path.closingCostsPct, ({ valueOf }) => valueOf(path.closingCostsMode) === 'amount');
  hidden(path.closingCostsAmount, ({ valueOf }) => valueOf(path.closingCostsMode) !== 'amount');
}
