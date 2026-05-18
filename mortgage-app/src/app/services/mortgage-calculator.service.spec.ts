import { TestBed } from '@angular/core/testing';
import { MortgageCalculatorService } from './mortgage-calculator.service';
import { LoanParams, EarlyRepayment } from '../models/mortgage.models';

const BASE_PARAMS: LoanParams = {
  loanAmount: 100000,
  loanYears: 30,
  fixedYears: 5,
  fixedRate: 2.9,
  euribor: 2.464,
  bankMargin: 2.1,
  gracePeriod: 0,
  erMode: 'reducePmt',
};

describe('MortgageCalculatorService', () => {
  let service: MortgageCalculatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MortgageCalculatorService);
  });

  // ── pmt() ──────────────────────────────────────────────────────────────────
  describe('pmt()', () => {
    it('should return 0 for zero principal', () => {
      expect(service.pmt(0, 5, 360)).toBe(0);
    });

    it('should return 0 for zero months', () => {
      expect(service.pmt(100000, 5, 0)).toBe(0);
    });

    it('should return principal / months for zero rate', () => {
      expect(service.pmt(12000, 0, 12)).toBeCloseTo(1000, 2);
    });

    it('should calculate monthly payment for 100k at 5% over 30yr correctly', () => {
      // Standard PMT: ≈ €536.82
      expect(service.pmt(100000, 5, 360)).toBeCloseTo(536.82, 0);
    });
  });

  // ── buildSchedule() ────────────────────────────────────────────────────────
  describe('buildSchedule()', () => {
    it('should produce 360 rows for a 30-year loan with no ERs', () => {
      const s = service.buildSchedule(BASE_PARAMS, []);
      expect(s.length).toBe(360);
    });

    it('should produce balance ≈ 0 at the end', () => {
      const s = service.buildSchedule(BASE_PARAMS, []);
      expect(s[s.length - 1].balance).toBeLessThan(1);
    });

    it('should sum principal + earlyAmt ≈ loanAmount', () => {
      const s = service.buildSchedule(BASE_PARAMS, []);
      const total = s.reduce((sum, r) => sum + r.principal + r.earlyAmt, 0);
      expect(total).toBeCloseTo(BASE_PARAMS.loanAmount, 0);
    });

    it('should mark fixed period rows isFixed=true', () => {
      const s = service.buildSchedule(BASE_PARAMS, []);
      const fixedMonths = BASE_PARAMS.fixedYears * 12;
      expect(s.slice(0, fixedMonths).every(r => r.isFixed)).toBe(true);
      expect(s.slice(fixedMonths).every(r => !r.isFixed)).toBe(true);
    });

    it('should mark grace rows with principal=0', () => {
      const p: LoanParams = { ...BASE_PARAMS, gracePeriod: 6 };
      const s = service.buildSchedule(p, []);
      expect(s.slice(0, 6).every(r => r.isGrace && r.principal === 0)).toBe(true);
      expect(s[6].isGrace).toBe(false);
    });

    it('should apply N.128/1975 surcharge correctly on declining balance', () => {
      const s = service.buildSchedule(BASE_PARAMS, []);
      const n128Rate = 0.0012 / 12;
      // First row N.128 ≈ loanAmount * rate (balance starts at loanAmount)
      expect(s[0].n128).toBeCloseTo(BASE_PARAMS.loanAmount * n128Rate, 2);
      // Each row N.128 = balance_before * rate; balance_before = newBalance + principal + earlyAmt
      s.forEach(r => {
        const balanceBefore = r.balance + r.principal + r.earlyAmt;
        expect(r.n128).toBeCloseTo(balanceBefore * n128Rate, 5);
      });
      // N.128 should decline over time as the balance decreases
      expect(s[s.length - 1].n128).toBeLessThan(s[0].n128);
    });

    it('should reduce schedule length in reduceDur mode with ER', () => {
      const er: EarlyRepayment[] = [{ id: 1, month: 12, amount: 10000 }];
      const withER  = service.buildSchedule({ ...BASE_PARAMS, erMode: 'reduceDur' }, er);
      const without = service.buildSchedule(BASE_PARAMS, []);
      expect(withER.length).toBeLessThan(without.length);
    });

    it('should reduce monthly payment in reducePmt mode with ER', () => {
      const er: EarlyRepayment[] = [{ id: 1, month: 12, amount: 10000 }];
      const withER  = service.buildSchedule({ ...BASE_PARAMS, erMode: 'reducePmt' }, er);
      const without = service.buildSchedule(BASE_PARAMS, []);
      // Payment after ER should be lower than without
      const pmtAfterER  = withER[12].payment;
      const pmtNoER     = without[12].payment;
      expect(pmtAfterER).toBeLessThan(pmtNoER);
    });

    it('should apply all early repayments scheduled for the same month', () => {
      const er: EarlyRepayment[] = [
        { id: 1, month: 12, amount: 10000 },
        { id: 2, month: 12, amount: 5000 },
      ];
      const schedule = service.buildSchedule({ ...BASE_PARAMS, erMode: 'reduceDur' }, er);
      const month12 = schedule.find(r => r.month === 12);
      const totalEarly = schedule.reduce((sum, r) => sum + r.earlyAmt, 0);

      expect(month12?.earlyAmt).toBeCloseTo(15000, 2);
      expect(totalEarly).toBeCloseTo(15000, 2);
    });

    it('should still fully amortize after a reducePmt early repayment during grace period', () => {
      const params: LoanParams = {
        loanAmount: 100000,
        loanYears: 30,
        fixedYears: 30,
        fixedRate: 3,
        euribor: 0,
        bankMargin: 0,
        gracePeriod: 12,
        erMode: 'reducePmt',
      };
      const schedule = service.buildSchedule(params, [{ id: 1, month: 1, amount: 10000 }]);
      const totalPrincipal = schedule.reduce((sum, r) => sum + r.principal + r.earlyAmt, 0);

      expect(schedule[schedule.length - 1].balance).toBeLessThan(1);
      expect(totalPrincipal).toBeCloseTo(params.loanAmount, 0);
    });

    it('should not reduce payment in reduceDur mode with ER', () => {
      const er: EarlyRepayment[] = [{ id: 1, month: 12, amount: 10000 }];
      const withER  = service.buildSchedule({ ...BASE_PARAMS, erMode: 'reduceDur' }, er);
      const without = service.buildSchedule(BASE_PARAMS, []);
      // The total monthly payment (pmtFixed) must be unchanged in reduceDur mode.
      // pmtFixed is never recalculated after an ER in reduceDur mode.
      expect(withER[12].payment).toBeCloseTo(without[12].payment, 0);
    });
  });

  // ── computeSummary() ───────────────────────────────────────────────────────
  describe('computeSummary()', () => {
    it('should return zeros for empty schedule', () => {
      const summary = service.computeSummary([], [], BASE_PARAMS);
      expect(summary.totalInterest).toBe(0);
      expect(summary.grandTotal).toBe(0);
    });

    it('should sum grand total correctly', () => {
      const s = service.buildSchedule(BASE_PARAMS, []);
      const summary = service.computeSummary(s, s, BASE_PARAMS);
      const expected = summary.totalPrincipal + summary.totalInterest + summary.totalN128;
      expect(summary.grandTotal).toBeCloseTo(expected, 2);
    });

    it('should report interestSaved when ERs present', () => {
      const er: EarlyRepayment[] = [{ id: 1, month: 12, amount: 10000 }];
      const schedule     = service.buildSchedule(BASE_PARAMS, er);
      const baseSchedule = service.buildSchedule(BASE_PARAMS, []);
      const summary = service.computeSummary(schedule, baseSchedule, BASE_PARAMS);
      expect(summary.interestSaved).toBeGreaterThan(0);
    });
  });

  // ── computeErMonthsSaved() ─────────────────────────────────────────────────
  describe('computeErMonthsSaved()', () => {
    it('should return empty map for no ERs', () => {
      expect(service.computeErMonthsSaved(BASE_PARAMS, [])).toEqual({});
    });

    it('should return positive months saved for a single ER in reduceDur mode', () => {
      const params: LoanParams = { ...BASE_PARAMS, erMode: 'reduceDur' };
      const er: EarlyRepayment[] = [{ id: 1, month: 12, amount: 10000 }];
      const map = service.computeErMonthsSaved(params, er);
      expect(map[1]).toBeGreaterThan(0);
    });
  });
});
