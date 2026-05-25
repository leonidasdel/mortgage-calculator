/** Central data-testid registry — pattern: {scope}-{role}-{name} */

export const Shell = {
  homeTitle: 'home-title',
  homeSearch: 'home-search',
  homeTool: (slug: string) => `home-tool-${slug}`,
  navLink: (slug: string) => `nav-link-${slug}`,
  lawFooter: 'law-footer',
  lawFooterPrivacy: 'law-footer-privacy',
  privacyTitle: 'privacy-page-title',
} as const;

export const Mortgage = {
  pageTitle: 'mortgage-page-title',
  results: 'mortgage-results',
  heroPayment: 'mortgage-hero-payment',
  inputLoanAmount: 'mortgage-input-loanAmount',
  inputLoanYears: 'mortgage-input-loanYears',
  inputFixedYears: 'mortgage-input-fixedYears',
  inputFixedRate: 'mortgage-input-fixedRate',
  inputEuribor: 'mortgage-input-euribor',
  inputBankMargin: 'mortgage-input-bankMargin',
  inputGracePeriod: 'mortgage-input-gracePeriod',
  deferredChart: 'mortgage-deferred-chart',
  deferredSchedule: 'mortgage-deferred-schedule',
} as const;

export const ConsumerLoan = {
  pageTitle: 'consumer-loan-page-title',
  results: 'consumer-loan-results',
  heroPayment: 'consumer-loan-hero-payment',
  inputLoanAmount: 'consumer-loan-input-loanAmount',
  inputInterestRate: 'consumer-loan-input-interestRate',
  inputLoanMonths: 'consumer-loan-input-loanMonths',
  inputLoanFees: 'consumer-loan-input-loanFees',
  pillMonths: (months: number) => `consumer-loan-pill-months-${months}`,
  deferredChart: 'consumer-loan-deferred-chart',
  deferredSchedule: 'consumer-loan-deferred-schedule',
} as const;

export const Salary = {
  pageTitle: 'salary-page-title',
  results: 'salary-results',
  heroNet: 'salary-hero-net',
  heroGross: 'salary-hero-gross',
  inputGrossMonthly: 'salary-input-grossMonthly',
  inputNetMonthly: 'salary-input-netMonthly',
  inputYear: 'salary-input-year',
  inputAgeGroup: 'salary-input-ageGroup',
  inputChildren: 'salary-input-children',
  inputFtePercent: 'salary-input-ftePercent',
  taxDetailsToggle: 'salary-tax-details-toggle',
} as const;

export const Severance = {
  pageTitle: 'severance-page-title',
  results: 'severance-results',
  heroNet: 'severance-hero-net',
  inputGrossMonthly: 'severance-input-grossMonthly',
  inputYearsOfService: 'severance-input-yearsOfService',
  inputMonthsExtra: 'severance-input-monthsExtra',
} as const;

export const Interest = {
  pageTitle: 'interest-page-title',
  results: 'interest-results',
  heroNetInterest: 'interest-hero-netInterest',
  inputCapital: 'interest-input-capital',
  inputRate: 'interest-input-rate',
  pillDuration: (days: number) => `interest-pill-duration-${days}`,
} as const;

export const Savings = {
  pageTitle: 'savings-page-title',
  results: 'savings-results',
  heroFinalBalance: 'savings-hero-finalBalance',
  inputInitialDeposit: 'savings-input-initialDeposit',
  inputMonthlyContribution: 'savings-input-monthlyContribution',
  inputAnnualReturn: 'savings-input-annualReturn',
  inputDurationYears: 'savings-input-durationYears',
  inputApplyTax: 'savings-input-applyTax',
  deferredChart: 'savings-deferred-chart',
} as const;

export const RentVsBuy = {
  pageTitle: 'rent-vs-buy-page-title',
  results: 'rent-vs-buy-results',
  heroMonthlyPayment: 'rent-vs-buy-hero-monthlyPayment',
  verdict: 'rent-vs-buy-verdict',
  inputPropertyPrice: 'rent-vs-buy-input-propertyPrice',
  inputDownPaymentAmount: 'rent-vs-buy-input-downPaymentAmount',
  inputClosingCostsAmount: 'rent-vs-buy-input-closingCostsAmount',
  inputMonthlyRent: 'rent-vs-buy-input-monthlyRent',
  inputTimeHorizon: 'rent-vs-buy-input-timeHorizon',
} as const;

export const RentalTax = {
  pageTitle: 'rental-tax-page-title',
  results: 'rental-tax-results',
  heroTax: 'rental-tax-hero-tax',
  annualIncome: 'rental-tax-annual-income',
  inputMonthlyIncome: 'rental-tax-input-monthlyIncome',
  incomeMonthlyPill: 'rental-tax-income-monthly',
  inputRentalType: 'rental-tax-input-rentalType',
} as const;

export const PropertyPurchase = {
  pageTitle: 'property-purchase-page-title',
  results: 'property-purchase-results',
  heroTotalCost: 'property-purchase-hero-totalCost',
  inputPurchasePrice: 'property-purchase-input-purchasePrice',
  inputAaotValue: 'property-purchase-input-aaotValue',
  inputChildren: 'property-purchase-input-children',
  inputIsFirstHome: 'property-purchase-input-isFirstHome',
} as const;

export const Freelancer = {
  pageTitle: 'freelancer-page-title',
  results: 'freelancer-results',
  heroNetMonthly: 'freelancer-hero-netMonthly',
  inputAnnualRevenue: 'freelancer-input-annualRevenue',
  inputAnnualExpenses: 'freelancer-input-annualExpenses',
  inputEfkaCategory: 'freelancer-input-efkaCategory',
  inputYearsActive: 'freelancer-input-yearsActive',
} as const;

export const UnusedLeave = {
  pageTitle: 'unused-leave-page-title',
  results: 'unused-leave-results',
  heroNet: 'unused-leave-hero-net',
  inputGrossMonthly: 'unused-leave-input-grossMonthly',
  inputUnusedDays: 'unused-leave-input-unusedDays',
  inputAgeGroup: 'unused-leave-input-ageGroup',
  inputChildren: 'unused-leave-input-children',
} as const;

export const AnnualBonus = {
  pageTitle: 'annual-bonus-page-title',
  results: 'annual-bonus-results',
  heroNet: 'annual-bonus-hero-net',
  inputGrossMonthly: 'annual-bonus-input-grossMonthly',
  inputAnnualBonus: 'annual-bonus-input-annualBonus',
  inputYear: 'annual-bonus-input-year',
  inputAgeGroup: 'annual-bonus-input-ageGroup',
} as const;

export const HolidayBonus = {
  pageTitle: 'holiday-bonus-page-title',
  results: 'holiday-bonus-results',
  heroNetTotal: 'holiday-bonus-hero-netTotal',
  inputGrossMonthly: 'holiday-bonus-input-grossMonthly',
  inputAgeGroup: 'holiday-bonus-input-ageGroup',
  inputChildren: 'holiday-bonus-input-children',
  inputChristmasMonthsWorked: 'holiday-bonus-input-christmasMonthsWorked',
} as const;

export const InheritanceGift = {
  pageTitle: 'inheritance-gift-page-title',
  results: 'inheritance-gift-results',
  heroTaxDue: 'inheritance-gift-hero-taxDue',
  inputTransferType: 'inheritance-gift-input-transferType',
  inputCategory: 'inheritance-gift-input-category',
  inputValue: 'inheritance-gift-input-value',
} as const;

export const CryptoTax = {
  pageTitle: 'crypto-tax-page-title',
  results: 'crypto-tax-results',
  heroTaxDue: 'crypto-tax-hero-taxDue',
  inputTotalProceeds: 'crypto-tax-input-totalProceeds',
  inputTotalCost: 'crypto-tax-input-totalCost',
  inputCarriedLoss: 'crypto-tax-input-carriedLoss',
} as const;

export const CarCost = {
  pageTitle: 'car-cost-page-title',
  results: 'car-cost-results',
  heroTotalAnnual: 'car-cost-hero-totalAnnual',
  inputEngineCc: 'car-cost-input-engineCc',
  inputInsuranceYear: 'car-cost-input-insuranceYear',
  inputIsEv: 'car-cost-input-isEv',
  inputMaintenanceYear: 'car-cost-input-maintenanceYear',
} as const;

export const ExportRow = {
  shareLink: 'export-share-link',
  copySummary: 'export-copy-summary',
} as const;

/** Route path → page-title testid */
export const PAGE_TITLE_BY_PATH: Record<string, string> = {
  '/': Shell.homeTitle,
  '/mortgage': Mortgage.pageTitle,
  '/consumer-loan': ConsumerLoan.pageTitle,
  '/salary': Salary.pageTitle,
  '/annual-bonus': AnnualBonus.pageTitle,
  '/holiday-bonus': HolidayBonus.pageTitle,
  '/freelancer': Freelancer.pageTitle,
  '/unused-leave': UnusedLeave.pageTitle,
  '/severance': Severance.pageTitle,
  '/interest': Interest.pageTitle,
  '/savings': Savings.pageTitle,
  '/rent-vs-buy': RentVsBuy.pageTitle,
  '/rental-tax': RentalTax.pageTitle,
  '/property-purchase': PropertyPurchase.pageTitle,
  '/inheritance-gift': InheritanceGift.pageTitle,
  '/crypto-tax': CryptoTax.pageTitle,
  '/car-cost': CarCost.pageTitle,
};

export function routeToSlug(route: string): string {
  return route.replace(/^\//, '');
}
