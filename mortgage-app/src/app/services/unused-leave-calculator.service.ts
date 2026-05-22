import { Injectable, inject } from '@angular/core';
import { EFKA_EMPLOYEE_RATE, MAX_INSURABLE_EARNINGS } from '../constants/payroll.constants';
import { AgeGroup } from '../models/salary.models';
import { SalaryCalculatorService } from './salary-calculator.service';

const EFKA_RATE = EFKA_EMPLOYEE_RATE;
const MAX_INSURABLE = MAX_INSURABLE_EARNINGS;

export interface TaxBracket {
  from: number;
  to: number | null;
  rate: number;
  taxableAmount: number;
  tax: number;
}

export interface UnusedLeaveParams {
  salaryType?: 'monthly' | 'daily' | string;
  grossMonthly?: number;
  dailyWage?: number;
  workWeek?: '5day' | '6day' | string;
  unusedDays?: number;
  includeHolidayBonus?: boolean;
  situation?: 'termination' | 'during_employment' | string;
  taxYear?: '2025' | '2026' | string;
  ageGroup?: AgeGroup | string;
  children?: number;
  useCustomAnnualIncome?: boolean;
  customAnnualGross?: number;
}

export interface LeaveResult {
  dailyWage: number;
  monthlyEquiv: number;
  leaveCompensation: number;
  holidayBonus: number;
  holidayBonusCapped: boolean;
  totalGross: number;
  efkaOnLeaveComp: number;
  efkaOnHolidayBonus: number;
  totalEfka: number;
  annualBaseGross: number;
  annualBaseTaxable: number;
  taxableLeaveComp: number;
  taxOnBase: number;
  taxOnTotalGross: number;
  taxDiscountAmount: number;
  taxOnTotal: number;
  marginalTax: number;
  effectiveTaxRate: number;
  totalNet: number;
  totalDeductions: number;
  taxBreakdown: TaxBracket[];
}

@Injectable({ providedIn: 'root' })
export class UnusedLeaveCalculatorService {
  private readonly salaryService = inject(SalaryCalculatorService);

  calculate(params: UnusedLeaveParams): LeaveResult {
    const salaryType       = params.salaryType as 'monthly' | 'daily';
    const workWeek         = params.workWeek as '5day' | '6day';
    const unusedDays       = Math.max(0, +(params.unusedDays || 0));
    const includeBonus     = !!params.includeHolidayBonus;
    const situation        = params.situation as 'termination' | 'during_employment';
    const taxYear          = params.taxYear as '2025' | '2026';
    const ageGroup         = (params.ageGroup || 'over30') as AgeGroup;
    const children         = Math.min(Math.max(0, +(params.children || 0)), 10);
    const useCustom        = !!params.useCustomAnnualIncome;

    const divisor = workWeek === '5day' ? 25 : 26;

    let dailyWage: number;
    let monthlyEquiv: number;

    if (salaryType === 'monthly') {
      monthlyEquiv = Math.max(0, +(params.grossMonthly || 0));
      dailyWage    = +(monthlyEquiv / divisor).toFixed(4);
    } else {
      dailyWage    = Math.max(0, +(params.dailyWage || 0));
      monthlyEquiv = +(dailyWage * divisor).toFixed(2);
    }

    const leaveCompensation = +(dailyWage * unusedDays).toFixed(2);

    let holidayBonus = 0;
    let holidayBonusCapped = false;
    if (includeBonus) {
      const rawBonus = leaveCompensation;
      const cap = salaryType === 'monthly'
        ? +(monthlyEquiv / 2).toFixed(2)
        : +(13 * dailyWage).toFixed(2);
      if (rawBonus > cap) {
        holidayBonus      = cap;
        holidayBonusCapped = true;
      } else {
        holidayBonus = rawBonus;
      }
    }

    const totalGross = +(leaveCompensation + holidayBonus).toFixed(2);

    let efkaOnLeaveComp   = 0;
    let efkaOnHolidayBonus = 0;

    if (situation === 'termination') {
      efkaOnLeaveComp    = 0;
      efkaOnHolidayBonus = +(Math.min(holidayBonus, MAX_INSURABLE) * EFKA_RATE).toFixed(2);
    } else {
      const insLeave    = Math.min(leaveCompensation, MAX_INSURABLE);
      const insBonus    = Math.min(holidayBonus, Math.max(0, MAX_INSURABLE - leaveCompensation));
      efkaOnLeaveComp    = +(insLeave * EFKA_RATE).toFixed(2);
      efkaOnHolidayBonus = +(insBonus * EFKA_RATE).toFixed(2);
    }

    const totalEfka = +(efkaOnLeaveComp + efkaOnHolidayBonus).toFixed(2);

    const taxableLeaveComp = Math.max(0, +(totalGross - totalEfka).toFixed(2));

    let annualBaseGross: number;
    if (useCustom) {
      annualBaseGross = Math.max(0, +(params.customAnnualGross || 0));
    } else {
      annualBaseGross = +(monthlyEquiv * 14).toFixed(2);
    }

    const monthlyForBase      = +(annualBaseGross / 14).toFixed(2);
    const insMonthlyBase      = Math.min(monthlyForBase, MAX_INSURABLE);
    const annualEfkaBase      = +(insMonthlyBase * EFKA_RATE * 14).toFixed(2);
    const annualBaseTaxable   = Math.max(0, +(annualBaseGross - annualEfkaBase).toFixed(2));

    const year = taxYear === '2026' ? 2026 : 2025;

    const taxOnBase  = this.calcTax(annualBaseTaxable, year, ageGroup, children);

    const totalAnnualTaxable = +(annualBaseTaxable + taxableLeaveComp).toFixed(2);
    const taxOnTotal = this.calcTax(totalAnnualTaxable, year, ageGroup, children);

    const marginalTax = Math.max(0, +(taxOnTotal.tax - taxOnBase.tax).toFixed(2));

    const taxOnTotalGross   = taxOnTotal.taxGross;
    const taxDiscountAmount = +(taxOnTotalGross - taxOnTotal.tax).toFixed(2);

    const effectiveTaxRate = taxableLeaveComp > 0
      ? +((marginalTax / taxableLeaveComp) * 100).toFixed(1)
      : 0;

    const totalDeductions = +(totalEfka + marginalTax).toFixed(2);
    const totalNet        = Math.max(0, +(totalGross - totalDeductions).toFixed(2));

    return {
      dailyWage:          +dailyWage.toFixed(2),
      monthlyEquiv,
      leaveCompensation,
      holidayBonus:       +holidayBonus.toFixed(2),
      holidayBonusCapped,
      totalGross,
      efkaOnLeaveComp,
      efkaOnHolidayBonus,
      totalEfka,
      annualBaseGross,
      annualBaseTaxable,
      taxableLeaveComp,
      taxOnBase:          taxOnBase.tax,
      taxOnTotalGross,
      taxDiscountAmount,
      taxOnTotal:         taxOnTotal.tax,
      marginalTax,
      effectiveTaxRate,
      totalNet,
      totalDeductions,
      taxBreakdown:       taxOnTotal.breakdown,
    };
  }

  private calcTax(
    taxable: number,
    year: number,
    ageGroup: AgeGroup,
    children: number,
  ): { tax: number; taxGross: number; breakdown: TaxBracket[] } {
    const result = this.salaryService.calculateTaxOnly(taxable, year, ageGroup, children);
    return {
      tax: result.annualTax,
      taxGross: result.totalTax,
      breakdown: result.breakdown.map(b => ({
        from: b.from,
        to: b.to,
        rate: b.rate,
        taxableAmount: b.taxableAmount,
        tax: b.tax,
      })),
    };
  }
}
