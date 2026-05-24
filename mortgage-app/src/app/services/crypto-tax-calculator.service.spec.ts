import { TestBed } from '@angular/core/testing';
import { CryptoTaxCalculatorService } from './crypto-tax-calculator.service';
describe('CryptoTaxCalculatorService', () => {
  let service: CryptoTaxCalculatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CryptoTaxCalculatorService);
  });

  it('should apply 15% tax in simple mode on net gain', () => {
    const result = service.calculate({
      mode: 'simple',
      totalProceeds: 10000,
      totalCost: 5000,
      carriedLoss: 0,
      acquisitions: [],
      disposals: [],
      isProfessional: false,
    });

    expect(result.netGain).toBe(5000);
    expect(result.taxableGain).toBe(5000);
    expect(result.taxDue).toBe(750);
  });

  it('should deduct carried loss before taxing gain', () => {
    const result = service.calculate({
      mode: 'simple',
      totalProceeds: 10000,
      totalCost: 5000,
      carriedLoss: 3000,
      acquisitions: [],
      disposals: [],
      isProfessional: false,
    });

    expect(result.netGain).toBe(5000);
    expect(result.taxableGain).toBe(2000);
    expect(result.taxDue).toBe(300);
    expect(result.lossCarryForward).toBe(0);
  });

  it('should return zero tax when there is no gain', () => {
    const result = service.calculate({
      mode: 'simple',
      totalProceeds: 8000,
      totalCost: 8000,
      carriedLoss: 0,
      acquisitions: [],
      disposals: [],
      isProfessional: false,
    });

    expect(result.netGain).toBe(0);
    expect(result.taxableGain).toBe(0);
    expect(result.taxDue).toBe(0);
  });
});
