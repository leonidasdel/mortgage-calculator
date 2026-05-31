import { hidden, SchemaPathTree } from '@angular/forms/signals';
import { minZero } from '../../utils/calculator-schemas/common-validators';

export interface CarCostModel {
  firstRegistration: string;
  isEv: boolean;
  engineCc: number;
  co2Grams: number;
  insuranceYear: number;
  fuelMode: string;
  fuelCostYear: number;
  kmPerYear: number;
  litersPer100km: number;
  pricePerLiter: number;
  maintenanceYear: number;
}

export function carCostFormSchema(path: SchemaPathTree<CarCostModel>): void {
  minZero(path.engineCc);
  minZero(path.co2Grams);
  minZero(path.insuranceYear);
  minZero(path.fuelCostYear);
  minZero(path.kmPerYear);
  minZero(path.litersPer100km);
  minZero(path.pricePerLiter);
  minZero(path.maintenanceYear);

  hidden(path.kmPerYear, ({ valueOf }) => valueOf(path.fuelMode) !== 'calc' || valueOf(path.isEv));
  hidden(
    path.litersPer100km,
    ({ valueOf }) => valueOf(path.fuelMode) !== 'calc' || valueOf(path.isEv),
  );
  hidden(
    path.pricePerLiter,
    ({ valueOf }) => valueOf(path.fuelMode) !== 'calc' || valueOf(path.isEv),
  );
  hidden(
    path.fuelCostYear,
    ({ valueOf }) => valueOf(path.fuelMode) === 'calc' || valueOf(path.isEv),
  );
}
