export type KinshipCategory = 'A' | 'B' | 'C';
export type TransferType = 'inheritance' | 'gift' | 'monetary';

export interface InheritanceBracket {
  upTo: number | null;
  rate: number;
}

/** Progressive inheritance/gift brackets by kinship category (Κ.Φ.Ε.) */
export const INHERITANCE_BRACKETS: Record<KinshipCategory, InheritanceBracket[]> = {
  A: [
    { upTo: 150000, rate: 0.01 },
    { upTo: 300000, rate: 0.05 },
    { upTo: 600000, rate: 0.1 },
    { upTo: null, rate: 0.1 },
  ],
  B: [
    { upTo: 30000, rate: 0.01 },
    { upTo: 100000, rate: 0.05 },
    { upTo: 300000, rate: 0.1 },
    { upTo: null, rate: 0.2 },
  ],
  C: [
    { upTo: 6000, rate: 0.01 },
    { upTo: 72000, rate: 0.1 },
    { upTo: 267000, rate: 0.2 },
    { upTo: null, rate: 0.4 },
  ],
};

/** Flat rates for monetary gifts (χρηματικά ποσά) */
export const MONETARY_GIFT_RATES: Record<KinshipCategory, number> = {
  A: 0.1,
  B: 0.2,
  C: 0.4,
};

/** Tax-free threshold for Category A asset gifts (σύζυγος, γονείς, τέκνα, εγγονιά) */
export const GIFT_EXEMPT_CATEGORY_A = 800000;

export const DISABILITY_TAX_REDUCTION = 0.1;

export const KINSHIP_LABELS: Record<KinshipCategory, string> = {
  A: 'Κατηγορία Α (σύζυγος, τέκνα, γονείς, εγγονιά)',
  B: 'Κατηγορία Β (αδέλφια, παππούδες, θείοι κ.λπ.)',
  C: 'Κατηγορία Γ (λοιποί / μη συγγενείς)',
};
