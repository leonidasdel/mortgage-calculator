import { Injectable } from '@angular/core';
import {
  calcCirculationFee,
  getRegistrationEra,
  RegistrationEra,
} from '../constants/circulation-fee.constants';

export interface CarCostParams {
  firstRegistration: string;
  isEv: boolean;
  engineCc: number;
  co2Grams: number;
  insuranceYear: number;
  maintenanceYear: number;
  fuelMode: 'calc' | 'manual';
  fuelCostYear: number;
  kmPerYear: number;
  litersPer100km: number;
  pricePerLiter: number;
}

export interface CarCostResult {
  era: RegistrationEra;
  circulationFee: number;
  insuranceYear: number;
  fuelCostYear: number;
  fuelLitersYear: number | null;
  maintenanceYear: number;
  totalAnnual: number;
  monthlyCost: number;
  eraLabel: string;
}

export function calcAnnualFuelCost(
  kmPerYear: number,
  litersPer100km: number,
  pricePerLiter: number,
): number {
  const km = Math.max(0, kmPerYear);
  const consumption = Math.max(0, litersPer100km);
  const price = Math.max(0, pricePerLiter);
  return +((km / 100) * consumption * price).toFixed(2);
}

export function calcFuelLitersPerYear(kmPerYear: number, litersPer100km: number): number {
  return +((Math.max(0, kmPerYear) / 100) * Math.max(0, litersPer100km)).toFixed(1);
}

@Injectable({ providedIn: 'root' })
export class CarCostCalculatorService {
  calculate(params: CarCostParams): CarCostResult {
    const era = getRegistrationEra(params.firstRegistration, params.isEv);
    const circulationFee = calcCirculationFee(era, params.engineCc, params.co2Grams);

    const insuranceYear = Math.max(0, params.insuranceYear);
    const maintenanceYear = Math.max(0, params.maintenanceYear);

    let fuelCostYear = 0;
    let fuelLitersYear: number | null = null;

    if (!params.isEv) {
      if (params.fuelMode === 'calc') {
        fuelLitersYear = calcFuelLitersPerYear(params.kmPerYear, params.litersPer100km);
        fuelCostYear = calcAnnualFuelCost(
          params.kmPerYear,
          params.litersPer100km,
          params.pricePerLiter,
        );
      } else {
        fuelCostYear = Math.max(0, params.fuelCostYear);
      }
    }

    const totalAnnual = circulationFee + insuranceYear + fuelCostYear + maintenanceYear;

    const eraLabels: Record<RegistrationEra, string> = {
      cc: 'Κυβισμός (≤31/10/2010)',
      co2_a: 'CO₂ (2010–2020)',
      co2_b: 'CO₂ (≥2021)',
      ev: 'Ηλεκτρικό (0€ τέλη)',
    };

    return {
      era,
      circulationFee,
      insuranceYear,
      fuelCostYear,
      fuelLitersYear,
      maintenanceYear,
      totalAnnual: +totalAnnual.toFixed(2),
      monthlyCost: +(totalAnnual / 12).toFixed(2),
      eraLabel: eraLabels[era],
    };
  }
}
