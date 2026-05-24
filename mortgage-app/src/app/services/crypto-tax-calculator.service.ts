import { Injectable } from '@angular/core';
import { CRYPTO_GAINS_TAX_RATE } from '../constants/crypto-tax.constants';

export interface CryptoLot {
  date: string;
  amount: number;
  costEur: number;
}

export interface CryptoTaxParams {
  mode: 'simple' | 'fifo';
  totalProceeds: number;
  totalCost: number;
  carriedLoss: number;
  acquisitions: CryptoLot[];
  disposals: CryptoLot[];
  isProfessional: boolean;
}

export interface CryptoTaxResult {
  netGain: number;
  taxableGain: number;
  taxDue: number;
  lossCarryForward: number;
  effectiveRate: number;
  fifoDetails: { proceeds: number; cost: number; gain: number }[];
  notes: string[];
}

@Injectable({ providedIn: 'root' })
export class CryptoTaxCalculatorService {
  calculate(params: CryptoTaxParams): CryptoTaxResult {
    const notes: string[] = [];

    if (params.isProfessional) {
      notes.push(
        'Επαγγελματική δραστηριότητα: ισχύουν κλιμακωτοί συντελεστές έως 44%. Συμβουλευτείτε λογιστή για την τελική εκκαθάριση.',
      );
    }

    let netGain: number;
    let fifoDetails: { proceeds: number; cost: number; gain: number }[] = [];

    if (params.mode === 'fifo' && params.disposals.length && params.acquisitions.length) {
      fifoDetails = this.calcFifo(params.acquisitions, params.disposals);
      netGain = +fifoDetails.reduce((s, d) => s + d.gain, 0).toFixed(2);
    } else {
      netGain = +(params.totalProceeds - params.totalCost).toFixed(2);
    }

    const withCarry = netGain - Math.max(0, params.carriedLoss);
    const taxableGain = Math.max(0, +withCarry.toFixed(2));
    const lossCarryForward =
      netGain < 0
        ? +Math.abs(netGain).toFixed(2)
        : params.carriedLoss > netGain
          ? +(params.carriedLoss - netGain).toFixed(2)
          : 0;

    const rate = params.isProfessional ? 0.15 : CRYPTO_GAINS_TAX_RATE;
    const taxDue = params.isProfessional
      ? +(taxableGain * rate).toFixed(2)
      : +(taxableGain * CRYPTO_GAINS_TAX_RATE).toFixed(2);

    const effectiveRate =
      params.totalProceeds > 0 && !params.isProfessional
        ? +((taxDue / params.totalProceeds) * 100).toFixed(2)
        : 0;

    return { netGain, taxableGain, taxDue, lossCarryForward, effectiveRate, fifoDetails, notes };
  }

  private calcFifo(
    acq: CryptoLot[],
    disp: CryptoLot[],
  ): { proceeds: number; cost: number; gain: number }[] {
    const pool = acq.map((a) => ({ ...a, remaining: a.amount }));
    const results: { proceeds: number; cost: number; gain: number }[] = [];

    for (const d of disp) {
      let toSell = d.amount;
      let cost = 0;
      for (const lot of pool) {
        if (toSell <= 0 || lot.remaining <= 0) continue;
        const take = Math.min(toSell, lot.remaining);
        const unitCost = lot.costEur / lot.amount;
        cost += take * unitCost;
        lot.remaining -= take;
        toSell -= take;
      }
      const gain = d.costEur - cost;
      results.push({ proceeds: d.costEur, cost: +cost.toFixed(2), gain: +gain.toFixed(2) });
    }
    return results;
  }
}
