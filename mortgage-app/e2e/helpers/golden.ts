/** Cent-exact expected values — sourced from service unit tests. */
export const golden = {
  mortgage: {
    default: { fixedPayment: 422.68 },
    loan200k_20y: { fixedPayment: 1111.2 },
  },
  consumerLoan: {
    default: { monthlyPayment: 271.26 },
  },
  salary: {
    default: { netMonthly: 1164.79 },
    gross2000: { netMonthly: 1484.4 },
  },
  annualBonus: {
    gross1500_bonus1000: { netBonus: 675.71 },
  },
  freelancer: {
    revenue60k: { netMonthly: 2578.95 },
  },
  unusedLeave: {
    days10: { totalNet: 851.04 },
    days5: { totalNet: 425.53 },
  },
  holidayBonus: {
    gross1500: { totalNet: 2410.79 },
  },
  interest: {
    capital10k_rate3_5_12mo: { netInterest: 297.5 },
  },
  severance: {
    gross2000_10y: { netSeverance: 13999.98 },
  },
  savings: {
    lumpSum10y: { finalBalance: 1647, decimals: 0 as const },
  },
  propertyPurchase: {
    default: { totalAcquisitionCost: 209890, decimals: 0 as const },
  },
  cryptoTax: {
    simple5kGain: { taxDue: 750 },
  },
  carCost: {
    default: { totalAnnual: 700 },
  },
  inheritanceGift: {
    exemptGift: { taxDue: 0 },
  },
  rentalTax: {
    monthly900: { annualIncome: 10800 },
  },
  rentVsBuy: {
    default: { downPayment: 50000 },
  },
  shareState: {
    consumerLoan7500: { monthlyPayment: 203.45 },
    salaryGross2200: { netMonthly: 1609.15 },
  },
} as const;
