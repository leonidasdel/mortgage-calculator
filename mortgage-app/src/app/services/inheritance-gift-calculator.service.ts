import { Injectable } from '@angular/core';
import {
  DISABILITY_TAX_REDUCTION,
  GIFT_EXEMPT_CATEGORY_A,
  INHERITANCE_BRACKETS,
  KinshipCategory,
  MONETARY_GIFT_RATES,
  TransferType,
} from '../constants/inheritance-gift.constants';

export interface InheritanceGiftParams {
  transferType: TransferType;
  category: KinshipCategory;
  value: number;
  hasDisability: boolean;
  applyPrimaryResidenceInfo: boolean;
}

export interface TaxBracketRow {
  from: number;
  to: number | null;
  rate: number;
  taxable: number;
  tax: number;
}

export interface InheritanceGiftResult {
  taxableBase: number;
  taxDue: number;
  effectiveRate: number;
  exemptAmount: number;
  brackets: TaxBracketRow[];
  notes: string[];
}

@Injectable({ providedIn: 'root' })
export class InheritanceGiftCalculatorService {
  calculate(params: InheritanceGiftParams): InheritanceGiftResult {
    const notes: string[] = [];
    let taxableBase = Math.max(0, params.value);
    let exemptAmount = 0;

    if (params.transferType === 'gift' && params.category === 'A') {
      exemptAmount = Math.min(taxableBase, GIFT_EXEMPT_CATEGORY_A);
      taxableBase = Math.max(0, taxableBase - GIFT_EXEMPT_CATEGORY_A);
      if (exemptAmount > 0) {
        notes.push(`Αφορολόγητο έως €${GIFT_EXEMPT_CATEGORY_A.toLocaleString('el-GR')} (κατ. Α).`);
      }
    }

    if (params.applyPrimaryResidenceInfo) {
      notes.push('Κύρια κατοικία: ενδέχεται απαλλαγή υπό προϋποθέσεις — συμβουλευτείτε λογιστή.');
    }

    let taxDue: number;
    let brackets: TaxBracketRow[] = [];

    if (params.transferType === 'monetary') {
      const rate = MONETARY_GIFT_RATES[params.category];
      taxDue = +(taxableBase * rate).toFixed(2);
      brackets = [{ from: 0, to: null, rate: rate * 100, taxable: taxableBase, tax: taxDue }];
    } else {
      const result = this.calcProgressive(taxableBase, INHERITANCE_BRACKETS[params.category]);
      taxDue = result.tax;
      brackets = result.brackets;
    }

    if (params.hasDisability) {
      const reduction = taxDue * DISABILITY_TAX_REDUCTION;
      taxDue = +(taxDue - reduction).toFixed(2);
      notes.push('Εφαρμόστηκε μείωση 10% (αναπηρία ≥67%).');
    }

    const effectiveRate = params.value > 0 ? +((taxDue / params.value) * 100).toFixed(2) : 0;

    return { taxableBase, taxDue, effectiveRate, exemptAmount, brackets, notes };
  }

  private calcProgressive(
    value: number,
    table: { upTo: number | null; rate: number }[],
  ): { tax: number; brackets: TaxBracketRow[] } {
    const brackets: TaxBracketRow[] = [];
    let remaining = value;
    let prev = 0;
    let tax = 0;

    for (const row of table) {
      if (remaining <= 0) break;
      const ceiling = row.upTo ?? Infinity;
      const bandSize = ceiling - prev;
      const taxable = Math.min(remaining, bandSize);
      const bandTax = +(taxable * row.rate).toFixed(2);
      if (taxable > 0) {
        brackets.push({
          from: prev,
          to: row.upTo,
          rate: row.rate * 100,
          taxable,
          tax: bandTax,
        });
        tax += bandTax;
      }
      remaining -= taxable;
      prev = ceiling;
    }

    return { tax: +tax.toFixed(2), brackets };
  }
}
