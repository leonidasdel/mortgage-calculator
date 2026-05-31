import { hidden, SchemaPathTree } from '@angular/forms/signals';
import { minZero } from '../../utils/calculator-schemas/common-validators';
import { RentalTaxModel } from './rental-tax.store';

export function rentalTaxFormSchema(path: SchemaPathTree<RentalTaxModel>): void {
  minZero(path.annualIncome);
  minZero(path.monthlyIncome);
  minZero(path.actualExpenses);

  hidden(path.annualIncome, ({ valueOf }) => valueOf(path.incomeMode) === 'monthly');
  hidden(path.monthlyIncome, ({ valueOf }) => valueOf(path.incomeMode) !== 'monthly');
}
