export type PctAmountMode = 'pct' | 'amount';

export interface PctAmountPairConfig {
  propertyPrice: number;
  mode: string;
  pct: number;
  amount: number;
}

export interface PctAmountPairUpdate {
  pct: number;
  amount: number;
}

/** Sync down-payment / closing-costs pct ↔ amount from the active mode. */
export function syncPctAmountPair(
  config: PctAmountPairConfig,
  source: PctAmountMode,
): PctAmountPairUpdate {
  const propertyPrice = Math.max(0, Number(config.propertyPrice) || 0);
  const mode = config.mode === 'amount' ? 'amount' : 'pct';

  if (source === 'pct' || mode === 'pct') {
    const pct = Math.min(100, Math.max(0, Number(config.pct) || 0));
    const amount = +((propertyPrice * pct) / 100).toFixed(2);
    return { pct, amount };
  }

  const amount = Math.min(propertyPrice, Math.max(0, Number(config.amount) || 0));
  const pct = propertyPrice > 0 ? +((amount / propertyPrice) * 100).toFixed(2) : 0;
  return { pct, amount };
}
