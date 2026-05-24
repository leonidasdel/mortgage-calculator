export type RegistrationEra = 'cc' | 'co2_a' | 'co2_b' | 'ev';

export interface CcBracket {
  maxCc: number;
  fee: number;
}

export interface Co2Bracket {
  maxCo2: number;
  ratePerGram: number;
}

/** Engine cc brackets for first registration ≤ 31.10.2010 */
export const CC_FEE_BRACKETS: CcBracket[] = [
  { maxCc: 800, fee: 22 },
  { maxCc: 900, fee: 55 },
  { maxCc: 1000, fee: 88 },
  { maxCc: 1100, fee: 110 },
  { maxCc: 1200, fee: 135 },
  { maxCc: 1300, fee: 165 },
  { maxCc: 1400, fee: 200 },
  { maxCc: 1500, fee: 235 },
  { maxCc: 1600, fee: 280 },
  { maxCc: 1800, fee: 390 },
  { maxCc: 2000, fee: 690 },
  { maxCc: 2500, fee: 1120 },
  { maxCc: 3000, fee: 1380 },
  { maxCc: Infinity, fee: 2000 },
];

/** CO2 scale A: registration 1.11.2010 – 31.12.2020 (€/g/km above band floor) */
export const CO2_SCALE_A: Co2Bracket[] = [
  { maxCo2: 90, ratePerGram: 0 },
  { maxCo2: 100, ratePerGram: 0.9 },
  { maxCo2: 120, ratePerGram: 0.98 },
  { maxCo2: 140, ratePerGram: 1.2 },
  { maxCo2: 160, ratePerGram: 1.85 },
  { maxCo2: 180, ratePerGram: 2.45 },
  { maxCo2: 200, ratePerGram: 2.78 },
  { maxCo2: 250, ratePerGram: 3.05 },
  { maxCo2: Infinity, ratePerGram: 3.72 },
];

/** CO2 scale B: registration ≥ 1.1.2021 */
export const CO2_SCALE_B: Co2Bracket[] = [
  { maxCo2: 122, ratePerGram: 0 },
  { maxCo2: 139, ratePerGram: 0.64 },
  { maxCo2: 166, ratePerGram: 0.7 },
  { maxCo2: 208, ratePerGram: 0.85 },
  { maxCo2: 224, ratePerGram: 1.87 },
  { maxCo2: 240, ratePerGram: 2.2 },
  { maxCo2: 260, ratePerGram: 2.5 },
  { maxCo2: 280, ratePerGram: 2.7 },
  { maxCo2: Infinity, ratePerGram: 2.85 },
];

export function parseRegistrationDate(dateStr: string): Date | null {
  if (!dateStr?.trim()) return null;
  const iso = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  }
  const gr = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (gr) {
    return new Date(Number(gr[3]), Number(gr[2]) - 1, Number(gr[1]));
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

/** Normalize to yyyy-mm-dd for input[type=date]. */
export function normalizeRegistrationDate(dateStr: string): string {
  const d = parseRegistrationDate(dateStr);
  if (!d) return '2015-06-01';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getRegistrationEra(dateStr: string, isEv: boolean): RegistrationEra {
  if (isEv) return 'ev';
  const d = parseRegistrationDate(dateStr);
  if (!d) return 'co2_b';
  const cutoff2010 = new Date(2010, 9, 31);
  const cutoff2020 = new Date(2020, 11, 31);
  if (d <= cutoff2010) return 'cc';
  if (d <= cutoff2020) return 'co2_a';
  return 'co2_b';
}

export function calcCirculationFee(era: RegistrationEra, cc: number, co2: number): number {
  if (era === 'ev') return 0;
  if (era === 'cc') {
    for (const b of CC_FEE_BRACKETS) {
      if (cc <= b.maxCc) return b.fee;
    }
    return CC_FEE_BRACKETS[CC_FEE_BRACKETS.length - 1].fee;
  }
  const table = era === 'co2_a' ? CO2_SCALE_A : CO2_SCALE_B;
  let fee = 0;
  let prevMax = 0;
  for (const b of table) {
    if (co2 <= prevMax) break;
    const gramsInBand = Math.min(co2, b.maxCo2) - prevMax;
    if (gramsInBand > 0) fee += gramsInBand * b.ratePerGram;
    prevMax = b.maxCo2;
    if (co2 <= b.maxCo2) break;
  }
  return Math.round(fee);
}
