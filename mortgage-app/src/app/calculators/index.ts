/**
 * Public API for portable calculator engines (Node, workers, mobile).
 * This is the only intentional barrel in the app.
 * Import domain-specific types from each `*.calc.ts` when names collide (e.g. TaxBracketRow).
 */
export {
  mortgagePmt,
  buildMortgageSchedule,
  computeMortgageSummary,
  computeMortgageErMonthsSaved,
} from './mortgage/mortgage.calc';
export { calculateInterest } from './interest/interest.calc';
export {
  calculateSalary,
  calculateTaxOnlySalary,
  buildSalaryParams,
  reverseCalculateSalary,
  calculateWithPartialBonusesSalary,
} from './salary/salary.calc';
export { calculatePropertyPurchase } from './property-purchase/property-purchase.calc';
export {
  calculateCarCost,
  calcAnnualFuelCost,
  calcFuelLitersPerYear,
} from './car-cost/car-cost.calc';
export { calculateInheritanceGift } from './inheritance-gift/inheritance-gift.calc';
export { calculateCryptoTax } from './crypto-tax/crypto-tax.calc';
export { calculateSavings } from './savings/savings.calc';
export { calculateRentalTax } from './rental-tax/rental-tax.calc';
export { calculateSeverance } from './severance/severance.calc';
export { calculateUnusedLeave } from './unused-leave/unused-leave.calc';
export { calculateFreelancer, EFKA_CATEGORIES } from './freelancer/freelancer.calc';
export { calculateRentVsBuy } from './rent-vs-buy/rent-vs-buy.calc';
export {
  buildConsumerLoanSchedule,
  calculateConsumerLoanSummary,
  calcConsumerLoanSeppe,
} from './consumer-loan/consumer-loan.calc';
