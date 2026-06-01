export interface RentalTaxBracket {
  from: number;
  to: number | null;
  rate: number;
}

/** Κ.Φ.Ε. — tax years through 2025 */
export const RENTAL_TAX_BRACKETS_2025: RentalTaxBracket[] = [
  { from: 0, to: 12000, rate: 0.15 },
  { from: 12000, to: 35000, rate: 0.35 },
  { from: 35000, to: null, rate: 0.45 },
];

/** Law 5246/2025 — tax year 2026 onwards */
export const RENTAL_TAX_BRACKETS_2026: RentalTaxBracket[] = [
  { from: 0, to: 12000, rate: 0.15 },
  { from: 12000, to: 24000, rate: 0.25 },
  { from: 24000, to: 36000, rate: 0.35 },
  { from: 36000, to: null, rate: 0.45 },
];

export function getRentalTaxBrackets(year: number): RentalTaxBracket[] {
  return year <= 2025 ? RENTAL_TAX_BRACKETS_2025 : RENTAL_TAX_BRACKETS_2026;
}
