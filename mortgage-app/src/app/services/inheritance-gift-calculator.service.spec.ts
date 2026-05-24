import { TestBed } from '@angular/core/testing';
import { InheritanceGiftCalculatorService } from './inheritance-gift-calculator.service';
import { GIFT_EXEMPT_CATEGORY_A } from '../constants/inheritance-gift.constants';

describe('InheritanceGiftCalculatorService', () => {
  let service: InheritanceGiftCalculatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InheritanceGiftCalculatorService);
  });

  it('should apply category A gift exemption up to the threshold', () => {
    const result = service.calculate({
      transferType: 'gift',
      category: 'A',
      value: 100000,
      hasDisability: false,
      applyPrimaryResidenceInfo: false,
    });

    expect(result.exemptAmount).toBe(100000);
    expect(result.taxableBase).toBe(0);
    expect(result.taxDue).toBe(0);
    expect(
      result.notes.some((n) => n.includes(GIFT_EXEMPT_CATEGORY_A.toLocaleString('el-GR'))),
    ).toBe(true);
  });

  it('should calculate progressive inheritance tax above zero', () => {
    const result = service.calculate({
      transferType: 'inheritance',
      category: 'A',
      value: 200000,
      hasDisability: false,
      applyPrimaryResidenceInfo: false,
    });

    expect(result.taxableBase).toBe(200000);
    expect(result.taxDue).toBe(4000);
    expect(result.exemptAmount).toBe(0);
  });
});
