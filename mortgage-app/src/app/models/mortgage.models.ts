export interface LoanParams {
  loanAmount: number;
  loanYears: number;
  fixedYears: number;
  fixedRate: number;
  euribor: number;
  bankMargin: number;
  gracePeriod: number;
  erMode: 'reducePmt' | 'reduceDur';
}

export interface AmortizationRow {
  month: number;
  date: Date;
  payment: number;
  principal: number;
  interest: number;
  n128: number;
  earlyAmt: number;
  balance: number;
  isGrace: boolean;
  isFixed: boolean;
  rate: number;
}

export interface EarlyRepayment {
  id: number;
  month: number;
  amount: number;
}

export interface BulkErParams {
  startMonth: number;
  amount: number;
  every: number;
  count: number;
}

export interface MortgageSummary {
  fixedPayment: number;
  variablePayment: number;
  totalPrincipal: number;
  totalInterest: number;
  totalN128: number;
  grandTotal: number;
  actualMonths: number;
  varRate: number;
  baseInterest?: number;
  interestSaved?: number;
  monthsSaved?: number;
}

export type ErMonthsSavedMap = Record<number, number>;
