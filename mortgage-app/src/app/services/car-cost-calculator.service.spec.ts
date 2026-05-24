import { TestBed } from '@angular/core/testing';
import { calcAnnualFuelCost, CarCostCalculatorService } from './car-cost-calculator.service';

describe('CarCostCalculatorService', () => {
  let service: CarCostCalculatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CarCostCalculatorService);
  });

  it('should charge zero circulation fee for EVs', () => {
    const result = service.calculate({
      firstRegistration: '2022-01-01',
      isEv: true,
      engineCc: 0,
      co2Grams: 0,
      insuranceYear: 400,
      maintenanceYear: 300,
      fuelMode: 'manual',
      fuelCostYear: 0,
      kmPerYear: 0,
      litersPer100km: 0,
      pricePerLiter: 0,
    });

    expect(result.era).toBe('ev');
    expect(result.circulationFee).toBe(0);
    expect(result.fuelCostYear).toBe(0);
    expect(result.totalAnnual).toBe(700);
  });

  it('should calculate annual fuel cost in calc mode', () => {
    const kmPerYear = 10000;
    const litersPer100km = 7;
    const pricePerLiter = 1.8;
    const expectedFuel = calcAnnualFuelCost(kmPerYear, litersPer100km, pricePerLiter);

    const result = service.calculate({
      firstRegistration: '2015-06-01',
      isEv: false,
      engineCc: 1400,
      co2Grams: 120,
      insuranceYear: 500,
      maintenanceYear: 400,
      fuelMode: 'calc',
      fuelCostYear: 0,
      kmPerYear,
      litersPer100km,
      pricePerLiter,
    });

    expect(result.fuelCostYear).toBe(expectedFuel);
    expect(result.fuelLitersYear).toBe(700);
  });
});
