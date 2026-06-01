// Greek private-sector payroll constants used by salary-related calculators.
export const EFKA_EMPLOYEE_RATE = 0.1337;
export const EFKA_EMPLOYER_RATE = 0.2179;

/** Max insurable monthly earnings (e-EFKΑ, 2025). */
export const MAX_INSURABLE_EARNINGS_2025 = 7572.62;

/** Max insurable monthly earnings (FEK B΄318/2026, +2.5% from 1.1.2026). */
export const MAX_INSURABLE_EARNINGS_2026 = 7761.94;

/** @deprecated Prefer {@link getMaxInsurableEarnings} with tax year. */
export const MAX_INSURABLE_EARNINGS = MAX_INSURABLE_EARNINGS_2025;

export function getMaxInsurableEarnings(year: number): number {
  return year <= 2025 ? MAX_INSURABLE_EARNINGS_2025 : MAX_INSURABLE_EARNINGS_2026;
}
