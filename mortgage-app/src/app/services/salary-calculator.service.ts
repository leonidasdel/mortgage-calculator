import { Injectable } from '@angular/core';
import {
  AgeGroup,
  AnnualBonusResult,
  BonusBreakdown,
  MonthlyBreakdown,
  MultiEmployerParams,
  MultiEmployerResult,
  SalaryChange,
  SalaryParams,
  SalaryResult,
  TaxBracketResult,
} from '../models/salary.models';
import {
  EFKA_EMPLOYEE_RATE,
  EFKA_EMPLOYER_RATE,
  MAX_INSURABLE_EARNINGS,
} from '../constants/payroll.constants';
import {
  BASE_TAX_DISCOUNTS,
  BRACKET_LIMITS,
  getTaxTable,
} from '../constants/tax-brackets.constants';

const MONTHS_PER_YEAR = 14; // 12 regular + Christmas + Easter/Leave
const LEAVE_SURCHARGE_RATE = 0.04166; // Προσαύξηση επιδόματος αδείας
const CHRISTMAS_BONUS_MONTHS = 8;
const EASTER_BONUS_MONTHS = 4;

export interface SalaryFormSlice {
  grossMonthly?: unknown;
  year?: unknown;
  ageGroup?: unknown;
  children?: unknown;
  hasSalaryChange?: unknown;
  salaryChangeMonth?: unknown;
  previousGross?: unknown;
  annualBonus?: unknown;
  ftePercent?: unknown;
}

export interface PartialBonusParams {
  grossMonthly: number;
  year: number;
  ageGroup: AgeGroup;
  children: number;
  partialEnabled: boolean;
  christmasMonthsWorked: number;
  easterMonthsWorked: number;
}

export interface AdjustedBonus {
  grossBase: number;
  leaveSurcharge: number;
  grossTotal: number;
  efka: number;
  tax: number;
  net: number;
}

export interface HolidayBonusResult {
  christmas: AdjustedBonus;
  easter: AdjustedBonus;
  leave: AdjustedBonus;
  christmasFactor: number;
  easterFactor: number;
  totalNet: number;
  totalGross: number;
  totalEfka: number;
  totalTax: number;
}

@Injectable({ providedIn: 'root' })
export class SalaryCalculatorService {
  calculate(params: SalaryParams): SalaryResult {
    const fte = Math.min(100, Math.max(1, params.ftePercent ?? 100)) / 100;
    const gross = Math.max(0, params.grossMonthly * fte);
    const totalGrossForInsurance = Math.min(gross, MAX_INSURABLE_EARNINGS);

    // Employee EFKA (monthly, for current salary)
    const efkaEmployee = +(totalGrossForInsurance * EFKA_EMPLOYEE_RATE).toFixed(2);
    const efkaEmployer = +(totalGrossForInsurance * EFKA_EMPLOYER_RATE).toFixed(2);

    // Determine bonus gross amounts and annual totals
    // Pro-rata when salary changed mid-year, otherwise standard
    let christmasGrossBase: number;
    let easterGrossBase: number;
    let leaveGrossBase: number;
    let annualGross14: number;
    let annualEfka14: number;
    let regularMonthlySum: number;
    let monthlyEfkaEmployeeSum: number;
    let monthlyEfkaEmployerSum: number;

    if (params.salaryChange) {
      const sc = params.salaryChange;
      const oldGross = Math.max(0, sc.previousGross);
      const cumDays = this.getCumulativeDays(params.year);

      // Pro-rata weighted salary for each bonus period
      const easterWeighted = this.getProRataGross(
        1,
        4,
        sc.effectiveMonth,
        oldGross,
        gross,
        cumDays,
      );
      const christmasWeighted = this.getProRataGross(
        5,
        12,
        sc.effectiveMonth,
        oldGross,
        gross,
        cumDays,
      );

      christmasGrossBase = +christmasWeighted.toFixed(2);
      easterGrossBase = +(easterWeighted / 2).toFixed(2);
      leaveGrossBase = +(easterWeighted / 2).toFixed(2);

      // Regular months (each fully old or fully new)
      const monthsOld = sc.effectiveMonth - 1;
      const monthsNew = 12 - monthsOld;
      regularMonthlySum = +(monthsOld * oldGross + monthsNew * gross).toFixed(2);

      // Monthly EFKA sums
      const oldEfkaEmployee = +(
        Math.min(oldGross, MAX_INSURABLE_EARNINGS) * EFKA_EMPLOYEE_RATE
      ).toFixed(2);
      const oldEfkaEmployer = +(
        Math.min(oldGross, MAX_INSURABLE_EARNINGS) * EFKA_EMPLOYER_RATE
      ).toFixed(2);
      monthlyEfkaEmployeeSum = +(monthsOld * oldEfkaEmployee + monthsNew * efkaEmployee).toFixed(2);
      monthlyEfkaEmployerSum = +(monthsOld * oldEfkaEmployer + monthsNew * efkaEmployer).toFixed(2);

      // 14-month annual for tax: regular months + bonus bases (without surcharges)
      annualGross14 = +(
        regularMonthlySum +
        christmasGrossBase +
        easterGrossBase +
        leaveGrossBase
      ).toFixed(2);

      // EFKA for 14-month: sum of monthly EFKAs + EFKA on bonus base amounts
      const christmasEfka14 = +(
        Math.min(christmasGrossBase, MAX_INSURABLE_EARNINGS) * EFKA_EMPLOYEE_RATE
      ).toFixed(2);
      const easterEfka14 = +(
        Math.min(easterGrossBase, MAX_INSURABLE_EARNINGS) * EFKA_EMPLOYEE_RATE
      ).toFixed(2);
      const leaveEfka14 = +(
        Math.min(leaveGrossBase, MAX_INSURABLE_EARNINGS) * EFKA_EMPLOYEE_RATE
      ).toFixed(2);
      annualEfka14 = +(
        monthlyEfkaEmployeeSum +
        christmasEfka14 +
        easterEfka14 +
        leaveEfka14
      ).toFixed(2);
    } else {
      christmasGrossBase = gross;
      easterGrossBase = +(gross / 2).toFixed(2);
      leaveGrossBase = +(gross / 2).toFixed(2);
      regularMonthlySum = +(gross * 12).toFixed(2);
      monthlyEfkaEmployeeSum = +(efkaEmployee * 12).toFixed(2);
      monthlyEfkaEmployerSum = +(efkaEmployer * 12).toFixed(2);
      annualGross14 = +(gross * MONTHS_PER_YEAR).toFixed(2);
      annualEfka14 = +(efkaEmployee * MONTHS_PER_YEAR).toFixed(2);
    }

    // Surcharges (4.166% leave allowance surcharge on bonuses)
    const christmasSurcharge = +(christmasGrossBase * LEAVE_SURCHARGE_RATE).toFixed(2);
    const christmasGrossTotal = +(christmasGrossBase + christmasSurcharge).toFixed(2);

    const easterSurcharge = +(easterGrossBase * LEAVE_SURCHARGE_RATE).toFixed(2);
    const easterGrossTotal = +(easterGrossBase + easterSurcharge).toFixed(2);

    // EFKA on actual bonus amounts (with surcharges)
    const christmasEfka = +(
      Math.min(christmasGrossTotal, MAX_INSURABLE_EARNINGS) * EFKA_EMPLOYEE_RATE
    ).toFixed(2);
    const easterEfka = +(
      Math.min(easterGrossTotal, MAX_INSURABLE_EARNINGS) * EFKA_EMPLOYEE_RATE
    ).toFixed(2);
    const leaveEfka = +(
      Math.min(leaveGrossBase, MAX_INSURABLE_EARNINGS) * EFKA_EMPLOYEE_RATE
    ).toFixed(2);

    // Tax calculation on 14-month base
    const taxableIncome = +(annualGross14 - annualEfka14).toFixed(2);
    const childrenIdx = Math.min(params.children, 6);
    const taxTable = getTaxTable(params.year);
    const brackets = taxTable[params.ageGroup];
    const { totalTax, breakdown } = this.calculateTax(taxableIncome, brackets, childrenIdx);
    const taxDiscount = this.getTaxDiscount(params.children, taxableIncome);
    const annualTax = Math.max(0, +(totalTax - taxDiscount).toFixed(2));

    // Tax distribution: proportional across 14 payment units
    const monthlyTax = +(annualTax / MONTHS_PER_YEAR).toFixed(2);
    const netMonthly = +(gross - efkaEmployee - monthlyTax).toFixed(2);

    // Before/after monthly breakdowns when salary change is active
    // Each period shows the tax as if that salary applied all year (what you see on the payslip)
    let previousMonthly: MonthlyBreakdown | undefined;
    let currentMonthly: MonthlyBreakdown | undefined;
    if (params.salaryChange) {
      const oldGross = Math.max(0, params.salaryChange.previousGross);
      const oldEfka = +(Math.min(oldGross, MAX_INSURABLE_EARNINGS) * EFKA_EMPLOYEE_RATE).toFixed(2);
      const oldMonthlyTax = this.calculateMonthlyTax(
        oldGross,
        oldEfka,
        childrenIdx,
        brackets,
        params.children,
      );
      previousMonthly = {
        grossMonthly: oldGross,
        efkaEmployee: oldEfka,
        incomeTax: oldMonthlyTax,
        netMonthly: +(oldGross - oldEfka - oldMonthlyTax).toFixed(2),
      };
      const newMonthlyTax = this.calculateMonthlyTax(
        gross,
        efkaEmployee,
        childrenIdx,
        brackets,
        params.children,
      );
      currentMonthly = {
        grossMonthly: gross,
        efkaEmployee: efkaEmployee,
        incomeTax: newMonthlyTax,
        netMonthly: +(gross - efkaEmployee - newMonthlyTax).toFixed(2),
      };
    }

    // Bonus taxes: annual tax distributed proportionally across 14 payment units
    // (confirmed: taxapps.gr uses "Βάσει ετήσιας κλίμακας" — annual tax scale)
    const christmasTax = monthlyTax;
    const christmasNet = +(christmasGrossTotal - christmasEfka - christmasTax).toFixed(2);

    const easterTax = +(monthlyTax / 2).toFixed(2);
    const easterNet = +(easterGrossTotal - easterEfka - easterTax).toFixed(2);

    const leaveTax = +(monthlyTax / 2).toFixed(2);
    const leaveNet = +(leaveGrossBase - leaveEfka - leaveTax).toFixed(2);

    // Actual annual totals (with surcharges), without bonus
    const annualGrossBase = +(
      regularMonthlySum +
      christmasGrossTotal +
      easterGrossTotal +
      leaveGrossBase
    ).toFixed(2);
    const annualEfka = +(monthlyEfkaEmployeeSum + christmasEfka + easterEfka + leaveEfka).toFixed(
      2,
    );
    const annualNetBase = +(annualGrossBase - annualEfka - annualTax).toFixed(2);

    // Employer cost
    const christmasEmployerEfka = +(
      Math.min(christmasGrossTotal, MAX_INSURABLE_EARNINGS) * EFKA_EMPLOYER_RATE
    ).toFixed(2);
    const easterEmployerEfka = +(
      Math.min(easterGrossTotal, MAX_INSURABLE_EARNINGS) * EFKA_EMPLOYER_RATE
    ).toFixed(2);
    const leaveEmployerEfka = +(
      Math.min(leaveGrossBase, MAX_INSURABLE_EARNINGS) * EFKA_EMPLOYER_RATE
    ).toFixed(2);
    const employerMonthly = +(gross + efkaEmployer).toFixed(2);
    const employerAnnual = +(
      regularMonthlySum +
      monthlyEfkaEmployerSum +
      christmasGrossTotal +
      christmasEmployerEfka +
      easterGrossTotal +
      easterEmployerEfka +
      leaveGrossBase +
      leaveEmployerEfka
    ).toFixed(2);

    // Annual bonus (μπόνους): subject to EFKA + marginal income tax.
    // Treat the bonus as a separate insured payment, then calculate marginal tax
    // against the actual annual taxable base that includes holiday-bonus surcharges.
    let bonusResult: AnnualBonusResult | undefined;
    if (params.annualBonus && params.annualBonus > 0) {
      const bonus = params.annualBonus;

      const bonusInsurable = Math.min(bonus, MAX_INSURABLE_EARNINGS);
      const bonusEfkaEmp = +(bonusInsurable * EFKA_EMPLOYEE_RATE).toFixed(2);
      const bonusEfkaEr = +(bonusInsurable * EFKA_EMPLOYER_RATE).toFixed(2);

      const taxableBaseForBonus = +(annualGrossBase - annualEfka).toFixed(2);
      const { totalTax: totalTaxBaseForBonus } = this.calculateTax(
        taxableBaseForBonus,
        brackets,
        childrenIdx,
      );
      const taxDiscountBaseForBonus = this.getTaxDiscount(params.children, taxableBaseForBonus);
      const annualTaxBaseForBonus = Math.max(
        0,
        +(totalTaxBaseForBonus - taxDiscountBaseForBonus).toFixed(2),
      );

      const taxableWithBonus = +(taxableBaseForBonus + bonus - bonusEfkaEmp).toFixed(2);
      const { totalTax: totalTaxWithBonus } = this.calculateTax(
        taxableWithBonus,
        brackets,
        childrenIdx,
      );
      const taxDiscountWithBonus = this.getTaxDiscount(params.children, taxableWithBonus);
      const annualTaxWithBonus = Math.max(
        0,
        +(totalTaxWithBonus - taxDiscountWithBonus).toFixed(2),
      );

      const bonusTax = Math.max(0, +(annualTaxWithBonus - annualTaxBaseForBonus).toFixed(2));
      const bonusNet = +(bonus - bonusEfkaEmp - bonusTax).toFixed(2);

      bonusResult = {
        grossBonus: bonus,
        efkaEmployee: bonusEfkaEmp,
        efkaEmployer: bonusEfkaEr,
        tax: bonusTax,
        net: bonusNet,
      };
    }

    // Final annual totals including bonus
    const finalAnnualGross = bonusResult
      ? +(annualGrossBase + bonusResult.grossBonus).toFixed(2)
      : annualGrossBase;
    const finalAnnualEfka = bonusResult
      ? +(annualEfka + bonusResult.efkaEmployee).toFixed(2)
      : annualEfka;
    const finalAnnualTax = bonusResult ? +(annualTax + bonusResult.tax).toFixed(2) : annualTax;
    const finalAnnualNet = bonusResult
      ? +(annualNetBase + bonusResult.net).toFixed(2)
      : annualNetBase;
    const finalEmployerAnnual = bonusResult
      ? +(employerAnnual + bonusResult.grossBonus + bonusResult.efkaEmployer).toFixed(2)
      : employerAnnual;

    const christmasBonus: BonusBreakdown = {
      grossBase: christmasGrossBase,
      leaveSurcharge: christmasSurcharge,
      grossTotal: christmasGrossTotal,
      efka: christmasEfka,
      tax: christmasTax,
      net: christmasNet,
    };

    const easterBonus: BonusBreakdown = {
      grossBase: easterGrossBase,
      leaveSurcharge: easterSurcharge,
      grossTotal: easterGrossTotal,
      efka: easterEfka,
      tax: easterTax,
      net: easterNet,
    };

    const leaveAllowance: BonusBreakdown = {
      grossBase: leaveGrossBase,
      leaveSurcharge: 0,
      grossTotal: leaveGrossBase,
      efka: leaveEfka,
      tax: leaveTax,
      net: leaveNet,
    };

    return {
      grossMonthly: gross,
      efkaEmployee,
      efkaEmployeeRate: EFKA_EMPLOYEE_RATE * 100,
      incomeTax: monthlyTax,
      netMonthly,
      previousMonthly,
      currentMonthly,
      annualGross: finalAnnualGross,
      annualEfka: finalAnnualEfka,
      annualTax: finalAnnualTax,
      annualNet: finalAnnualNet,
      annualGrossBase,
      annualNetBase,
      christmasBonus,
      easterBonus,
      leaveAllowance,
      bonusResult,
      employerMonthly,
      efkaEmployer,
      efkaEmployerRate: EFKA_EMPLOYER_RATE * 100,
      employerAnnual: finalEmployerAnnual,
      taxBreakdown: breakdown,
      taxDiscount,
      taxableIncome,
    };
  }

  /**
   * Reverse calculation: given net monthly salary, find the gross.
   * Uses binary search for precision.
   */
  reverseCalculate(netTarget: number, params: Omit<SalaryParams, 'grossMonthly'>): number {
    if (netTarget <= 0) return 0;

    let lo = netTarget;
    let hi = netTarget * 3;

    // Ensure hi is high enough
    for (let i = 0; i < 10; i++) {
      const result = this.calculate({ ...params, grossMonthly: hi });
      if (result.netMonthly >= netTarget) break;
      hi *= 2;
    }

    // Binary search
    for (let i = 0; i < 100; i++) {
      const mid = (lo + hi) / 2;
      const result = this.calculate({ ...params, grossMonthly: mid });
      if (Math.abs(result.netMonthly - netTarget) < 0.005) {
        return +mid.toFixed(2);
      }
      if (result.netMonthly < netTarget) {
        lo = mid;
      } else {
        hi = mid;
      }
    }

    return +((lo + hi) / 2).toFixed(2);
  }

  /**
   * Standalone income-tax calculation for salaried-style progressive brackets.
   * Used by calculators that share the same scale but may not apply Article 16 discounts.
   */
  calculateTaxOnly(
    taxableIncome: number,
    year: number,
    ageGroup: AgeGroup,
    children: number,
  ): { totalTax: number; breakdown: TaxBracketResult[]; taxDiscount: number; annualTax: number } {
    const childrenIdx = Math.min(children, 6);
    const taxTable = getTaxTable(year);
    const brackets = taxTable[ageGroup];
    const { totalTax, breakdown } = this.calculateTax(taxableIncome, brackets, childrenIdx);
    const taxDiscount = this.getTaxDiscount(children, taxableIncome);
    const annualTax = Math.max(0, +(totalTax - taxDiscount).toFixed(2));
    return { totalTax, breakdown, taxDiscount, annualTax };
  }

  /**
   * Calculate pro-rata weighted gross salary for a bonus period.
   * Returns the weighted average gross based on days at each salary.
   */
  private getProRataGross(
    periodStartMonth: number,
    periodEndMonth: number,
    changeMonth: number,
    oldGross: number,
    newGross: number,
    cumDays: number[],
  ): number {
    const periodStart = cumDays[periodStartMonth - 1];
    const periodEnd = cumDays[periodEndMonth];
    const totalDays = periodEnd - periodStart;

    const changeDay = cumDays[changeMonth - 1];

    if (changeDay <= periodStart) return newGross;
    if (changeDay >= periodEnd) return oldGross;

    const daysOld = changeDay - periodStart;
    const daysNew = periodEnd - changeDay;
    return (daysOld / totalDays) * oldGross + (daysNew / totalDays) * newGross;
  }

  /**
   * Cumulative days from start of year, accounting for leap years.
   * Index 0 = Jan 1 (day 0), Index 12 = end of Dec (day 365 or 366).
   */
  private getCumulativeDays(year: number): number[] {
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    if (isLeap) {
      return [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335, 366];
    }
    return [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365];
  }

  /**
   * Calculate monthly tax as if a given gross salary applied for the full year (14 months).
   * Used for before/after monthly breakdowns so each shows the standalone payslip tax.
   */
  private calculateMonthlyTax(
    grossMonthly: number,
    efkaMonthly: number,
    childrenIdx: number,
    brackets: number[][],
    children: number,
  ): number {
    const annualGross14 = +(grossMonthly * MONTHS_PER_YEAR).toFixed(2);
    const annualEfka14 = +(efkaMonthly * MONTHS_PER_YEAR).toFixed(2);
    const taxableIncome = +(annualGross14 - annualEfka14).toFixed(2);
    const { totalTax } = this.calculateTax(taxableIncome, brackets, childrenIdx);
    const taxDiscount = this.getTaxDiscount(children, taxableIncome);
    const annualTax = Math.max(0, +(totalTax - taxDiscount).toFixed(2));
    return +(annualTax / MONTHS_PER_YEAR).toFixed(2);
  }

  private calculateTax(
    taxableIncome: number,
    brackets: number[][],
    childrenIdx: number,
  ): { totalTax: number; breakdown: TaxBracketResult[] } {
    const breakdown: TaxBracketResult[] = [];
    let remaining = taxableIncome;
    let totalTax = 0;

    for (let i = 0; i < brackets.length; i++) {
      const from = i === 0 ? 0 : BRACKET_LIMITS[i - 1];
      const to = i < BRACKET_LIMITS.length ? BRACKET_LIMITS[i] : null;
      const rate = brackets[i][childrenIdx];
      const bracketSize = to !== null ? to - from : Infinity;
      const taxableInBracket = Math.min(Math.max(0, remaining), bracketSize);

      if (taxableInBracket > 0 || remaining > 0) {
        const tax = +(taxableInBracket * rate).toFixed(2);
        totalTax += tax;
        breakdown.push({
          from,
          to,
          rate: rate * 100,
          taxableAmount: taxableInBracket,
          tax,
        });
      }

      remaining -= bracketSize;
      if (remaining <= 0) break;
    }

    return { totalTax: +totalTax.toFixed(2), breakdown };
  }

  private getTaxDiscount(children: number, taxableIncome: number): number {
    let baseDiscount: number;
    if (children <= 5) {
      baseDiscount = BASE_TAX_DISCOUNTS[children];
    } else {
      baseDiscount = 1780 + 220 * (children - 5);
    }

    // Reduction: 20€ per 1,000€ above 12,000€
    if (taxableIncome > 12000) {
      const excess = taxableIncome - 12000;
      const reduction = (excess / 1000) * 20;
      baseDiscount = Math.max(0, baseDiscount - reduction);
    }

    return +baseDiscount.toFixed(2);
  }

  calculateMultiEmployer(params: MultiEmployerParams): MultiEmployerResult {
    const warnings: string[] = [];
    const employers = params.grossEmployers
      .filter((g) => g > 0)
      .map((gross) => {
        const insurable = Math.min(gross, MAX_INSURABLE_EARNINGS);
        const efkaEmployee = +(insurable * EFKA_EMPLOYEE_RATE).toFixed(2);
        const efkaEmployer = +(insurable * EFKA_EMPLOYER_RATE).toFixed(2);
        return { gross, efkaEmployee, efkaEmployer, netEstimate: 0 };
      });

    const combinedGross = +employers.reduce((s, e) => s + e.gross, 0).toFixed(2);
    const totalInsurable = employers.reduce(
      (s, e) => s + Math.min(e.gross, MAX_INSURABLE_EARNINGS),
      0,
    );
    if (totalInsurable > MAX_INSURABLE_EARNINGS * employers.length) {
      warnings.push(
        'Το άθροισμα ασφαλιστέων αποδοχών μπορεί να επηρεάζει την ακρίβεια — επαλήθευση με ΕΦΚΑ.',
      );
    }

    const combinedEfkaEmployee = +employers.reduce((s, e) => s + e.efkaEmployee, 0).toFixed(2);
    const annualGross14 = +(combinedGross * MONTHS_PER_YEAR).toFixed(2);
    const annualEfka14 = +(combinedEfkaEmployee * MONTHS_PER_YEAR).toFixed(2);
    const taxableIncome = +(annualGross14 - annualEfka14).toFixed(2);
    const childrenIdx = Math.min(params.children, 6);
    const taxTable = getTaxTable(params.year);
    const brackets = taxTable[params.ageGroup];
    const { totalTax } = this.calculateTax(taxableIncome, brackets, childrenIdx);
    const taxDiscount = this.getTaxDiscount(params.children, taxableIncome);
    const annualTax = Math.max(0, +(totalTax - taxDiscount).toFixed(2));
    const monthlyTax = +(annualTax / MONTHS_PER_YEAR).toFixed(2);

    for (const e of employers) {
      const share = combinedGross > 0 ? e.gross / combinedGross : 0;
      e.netEstimate = +(e.gross - e.efkaEmployee - monthlyTax * share).toFixed(2);
    }

    const combinedNetEstimate = +employers.reduce((s, e) => s + e.netEstimate, 0).toFixed(2);

    return {
      employers,
      combinedGross,
      combinedEfkaEmployee,
      combinedNetEstimate,
      annualTax,
      warnings,
    };
  }

  buildSalaryParams(form: SalaryFormSlice, extras?: { annualBonus?: number }): SalaryParams {
    const hasSalaryChange = !!form.hasSalaryChange;
    const salaryChange: SalaryChange | undefined = hasSalaryChange
      ? {
          effectiveMonth: this.clampMonth(form.salaryChangeMonth),
          previousGross: this.toAmount(form.previousGross),
        }
      : undefined;

    return {
      grossMonthly: this.toAmount(form.grossMonthly),
      year: Number(form.year) || 2026,
      ageGroup: (form.ageGroup || 'over30') as AgeGroup,
      children: Math.max(0, Number(form.children) || 0),
      annualBonus: extras?.annualBonus ?? this.toAmount(form.annualBonus),
      salaryChange,
      ftePercent: form.ftePercent != null ? Number(form.ftePercent) || 100 : undefined,
    };
  }

  calculateWithPartialBonuses(params: PartialBonusParams): HolidayBonusResult {
    const base = this.calculate({
      grossMonthly: Math.max(0, params.grossMonthly),
      year: params.year,
      ageGroup: params.ageGroup,
      children: Math.max(0, params.children),
    });

    const cFactor = params.partialEnabled
      ? Math.min(1, Math.max(0, params.christmasMonthsWorked / CHRISTMAS_BONUS_MONTHS))
      : 1;
    const eFactor = params.partialEnabled
      ? Math.min(1, Math.max(0, params.easterMonthsWorked / EASTER_BONUS_MONTHS))
      : 1;

    const applyFactor = (b: BonusBreakdown, f: number): AdjustedBonus => ({
      grossBase: +(b.grossBase * f).toFixed(2),
      leaveSurcharge: +(b.leaveSurcharge * f).toFixed(2),
      grossTotal: +(b.grossTotal * f).toFixed(2),
      efka: +(b.efka * f).toFixed(2),
      tax: +(b.tax * f).toFixed(2),
      net: +(b.net * f).toFixed(2),
    });

    const christmas = applyFactor(base.christmasBonus, cFactor);
    const easter = applyFactor(base.easterBonus, eFactor);
    const leave = applyFactor(base.leaveAllowance, eFactor);

    return {
      christmas,
      easter,
      leave,
      christmasFactor: cFactor,
      easterFactor: eFactor,
      totalNet: +(christmas.net + easter.net + leave.net).toFixed(2),
      totalGross: +(christmas.grossTotal + easter.grossTotal + leave.grossTotal).toFixed(2),
      totalEfka: +(christmas.efka + easter.efka + leave.efka).toFixed(2),
      totalTax: +(christmas.tax + easter.tax + leave.tax).toFixed(2),
    };
  }

  private toAmount(value: unknown): number {
    return Math.max(0, Number(value) || 0);
  }

  private clampMonth(value: unknown): number {
    return Math.min(12, Math.max(1, Number(value) || 4));
  }
}
