export type AgeGroup = 'under25' | '26to30' | 'over30';

export interface SalaryChange {
  effectiveMonth: number;  // 1-12, change happens on the 1st of this month
  previousGross: number;   // Gross salary before the change
}

export interface SalaryParams {
  grossMonthly: number;    // Current (new) gross salary
  year: number;
  ageGroup: AgeGroup;
  children: number;
  annualBonus?: number;
  salaryChange?: SalaryChange;
}

export interface AnnualBonusResult {
  grossBonus: number;
  efkaEmployee: number;
  efkaEmployer: number;
  tax: number;
  net: number;
}

export interface BonusBreakdown {
  grossBase: number;
  leaveSurcharge: number;
  grossTotal: number;
  efka: number;
  tax: number;
  net: number;
}

export interface MonthlyBreakdown {
  grossMonthly: number;
  efkaEmployee: number;
  incomeTax: number;
  netMonthly: number;
}

export interface SalaryResult {
  grossMonthly: number;
  efkaEmployee: number;
  efkaEmployeeRate: number;
  incomeTax: number;
  netMonthly: number;

  // When salary change is active: before/after breakdowns
  previousMonthly?: MonthlyBreakdown;
  currentMonthly?: MonthlyBreakdown;

  annualGross: number;       // includes bonus if present
  annualEfka: number;
  annualTax: number;
  annualNet: number;         // includes bonus if present
  annualGrossBase: number;   // without bonus
  annualNetBase: number;     // without bonus

  christmasBonus: BonusBreakdown;
  easterBonus: BonusBreakdown;
  leaveAllowance: BonusBreakdown;

  employerMonthly: number;
  efkaEmployer: number;
  efkaEmployerRate: number;
  employerAnnual: number;

  taxBreakdown: TaxBracketResult[];
  taxDiscount: number;
  taxableIncome: number;
  bonusResult?: AnnualBonusResult;
}

export interface TaxBracketResult {
  from: number;
  to: number | null;
  rate: number;
  taxableAmount: number;
  tax: number;
}
