export type AgeGroup = 'under25' | '26to30' | 'over30';

export interface SalaryParams {
  grossMonthly: number;
  year: number;
  ageGroup: AgeGroup;
  children: number;
  benefitsInKind: BenefitInKind[];
}

export interface BenefitInKind {
  id: number;
  description: string;
  monthlyValue: number;
}

export interface SalaryResult {
  grossMonthly: number;
  efkaEmployee: number;
  efkaEmployeeRate: number;
  incomeTax: number;
  netMonthly: number;

  annualGross: number;
  annualEfka: number;
  annualTax: number;
  annualNet: number;

  christmasBonus: number;
  easterBonus: number;
  leaveAllowance: number;

  employerMonthly: number;
  efkaEmployer: number;
  efkaEmployerRate: number;
  employerAnnual: number;

  taxBreakdown: TaxBracketResult[];
  taxDiscount: number;
  taxableIncome: number;
}

export interface TaxBracketResult {
  from: number;
  to: number | null;
  rate: number;
  taxableAmount: number;
  tax: number;
}
