import { Injectable } from '@angular/core';
import {
  DEFAULT_WEEKLY_HOURS_EXAHIMERO,
  DEFAULT_WEEKLY_HOURS_PENTHIMERO,
  OVERTIME_FIRST_TIER_HOURS,
  OVERTIME_MAX_HOURS_YEAR,
  OVERTIME_SURCHARGE_EXCESS,
  OVERTIME_SURCHARGE_FIRST,
  SIXTH_DAY_MAX_HOURS,
  SIXTH_DAY_SURCHARGE,
} from '../constants/overtime.constants';

export type WorkSchedule = 'penthimero' | 'exahimero';

export interface OvertimeParams {
  grossMonthly: number;
  schedule: WorkSchedule;
  overtimeHoursYear: number;
  sixthDayHours: number;
  includeSixthDay: boolean;
}

export interface OvertimeResult {
  hourlyWage: number;
  weeklyHours: number;
  overtimeHoursCapped: number;
  hoursAt40: number;
  hoursAt60: number;
  overtimeGross: number;
  sixthDayGross: number;
  totalExtraGross: number;
  effectiveRate40: number;
  effectiveRate60: number;
  warnings: string[];
}

@Injectable({ providedIn: 'root' })
export class OvertimeCalculatorService {
  calculate(params: OvertimeParams): OvertimeResult {
    const warnings: string[] = [];
    const weeklyHours = params.schedule === 'exahimero'
      ? DEFAULT_WEEKLY_HOURS_EXAHIMERO
      : DEFAULT_WEEKLY_HOURS_PENTHIMERO;

    const hourlyWage = params.grossMonthly / (weeklyHours * 52 / 12);

    let otHours = Math.max(0, params.overtimeHoursYear);
    if (otHours > OVERTIME_MAX_HOURS_YEAR) {
      warnings.push(`Υπέρβαση ορίου ${OVERTIME_MAX_HOURS_YEAR} ωρών/έτος — εμφανίζονται μόνο οι νόμιμες.`);
      otHours = OVERTIME_MAX_HOURS_YEAR;
    }

    const hoursAt40 = Math.min(otHours, OVERTIME_FIRST_TIER_HOURS);
    const hoursAt60 = Math.max(0, otHours - OVERTIME_FIRST_TIER_HOURS);

    const overtimeGross = +(
      hoursAt40 * hourlyWage * (1 + OVERTIME_SURCHARGE_FIRST) +
      hoursAt60 * hourlyWage * (1 + OVERTIME_SURCHARGE_EXCESS)
    ).toFixed(2);

    let sixthDayGross = 0;
    if (params.includeSixthDay && params.sixthDayHours > 0) {
      let h = Math.min(params.sixthDayHours, SIXTH_DAY_MAX_HOURS);
      if (params.sixthDayHours > SIXTH_DAY_MAX_HOURS) {
        warnings.push('6η μέρα: μέγιστο 8 ώρες/εβδομάδα.');
      }
      sixthDayGross = +(h * hourlyWage * (1 + SIXTH_DAY_SURCHARGE) * 52 / 12).toFixed(2);
    }

    return {
      hourlyWage: +hourlyWage.toFixed(2),
      weeklyHours,
      overtimeHoursCapped: otHours,
      hoursAt40,
      hoursAt60,
      overtimeGross,
      sixthDayGross,
      totalExtraGross: +(overtimeGross + sixthDayGross).toFixed(2),
      effectiveRate40: +(hourlyWage * (1 + OVERTIME_SURCHARGE_FIRST)).toFixed(2),
      effectiveRate60: +(hourlyWage * (1 + OVERTIME_SURCHARGE_EXCESS)).toFixed(2),
      warnings,
    };
  }
}
