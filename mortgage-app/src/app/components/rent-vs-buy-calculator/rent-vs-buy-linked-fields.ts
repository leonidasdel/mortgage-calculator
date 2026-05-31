import { DestroyRef, effect, untracked, WritableSignal } from '@angular/core';
import {
  PctAmountMode,
  syncPctAmountPair,
} from '../../utils/calculator-schemas/pct-amount-pair.util';
import { RentVsBuyModel } from './rent-vs-buy.store';

function syncPair(
  m: RentVsBuyModel,
  source: PctAmountMode,
  mode: 'downPayment' | 'closingCosts',
): Partial<
  Pick<
    RentVsBuyModel,
    'downPaymentPct' | 'downPaymentAmount' | 'closingCostsPct' | 'closingCostsAmount'
  >
> {
  if (mode === 'downPayment') {
    const synced = syncPctAmountPair(
      {
        propertyPrice: m.propertyPrice,
        mode: m.downPaymentMode,
        pct: m.downPaymentPct,
        amount: m.downPaymentAmount,
      },
      source,
    );
    return { downPaymentPct: synced.pct, downPaymentAmount: synced.amount };
  }
  const synced = syncPctAmountPair(
    {
      propertyPrice: m.propertyPrice,
      mode: m.closingCostsMode,
      pct: m.closingCostsPct,
      amount: m.closingCostsAmount,
    },
    source,
  );
  return { closingCostsPct: synced.pct, closingCostsAmount: synced.amount };
}

export function setupRentVsBuyLinkedFields(
  formModel: WritableSignal<RentVsBuyModel>,
  destroyRef: DestroyRef,
): {
  onDownPaymentModeChange: (mode: PctAmountMode) => void;
  onClosingCostsModeChange: (mode: PctAmountMode) => void;
} {
  let prev = snapshot(formModel());

  const ref = effect(() => {
    const m = formModel();

    untracked(() => {
      if (m.propertyPrice !== prev.propertyPrice) {
        formModel.update((v) => ({
          ...v,
          ...syncPair(v, v.downPaymentMode === 'amount' ? 'amount' : 'pct', 'downPayment'),
          ...syncPair(v, v.closingCostsMode === 'amount' ? 'amount' : 'pct', 'closingCosts'),
        }));
      } else if (m.downPaymentMode !== prev.downPaymentMode) {
        formModel.update((v) => ({
          ...v,
          ...syncPair(v, v.downPaymentMode === 'amount' ? 'amount' : 'pct', 'downPayment'),
        }));
      } else if (m.closingCostsMode !== prev.closingCostsMode) {
        formModel.update((v) => ({
          ...v,
          ...syncPair(v, v.closingCostsMode === 'amount' ? 'amount' : 'pct', 'closingCosts'),
        }));
      } else if (m.downPaymentMode !== 'amount' && m.downPaymentPct !== prev.downPaymentPct) {
        formModel.update((v) => ({ ...v, ...syncPair(v, 'pct', 'downPayment') }));
      } else if (m.downPaymentMode === 'amount' && m.downPaymentAmount !== prev.downPaymentAmount) {
        formModel.update((v) => ({ ...v, ...syncPair(v, 'amount', 'downPayment') }));
      } else if (m.closingCostsMode !== 'amount' && m.closingCostsPct !== prev.closingCostsPct) {
        formModel.update((v) => ({ ...v, ...syncPair(v, 'pct', 'closingCosts') }));
      } else if (
        m.closingCostsMode === 'amount' &&
        m.closingCostsAmount !== prev.closingCostsAmount
      ) {
        formModel.update((v) => ({ ...v, ...syncPair(v, 'amount', 'closingCosts') }));
      }
    });

    prev = snapshot(formModel());
  });

  destroyRef.onDestroy(() => ref.destroy());

  return {
    onDownPaymentModeChange: (mode) => {
      formModel.update((v) => ({ ...v, downPaymentMode: mode }));
    },
    onClosingCostsModeChange: (mode) => {
      formModel.update((v) => ({ ...v, closingCostsMode: mode }));
    },
  };
}

function snapshot(m: RentVsBuyModel) {
  return {
    propertyPrice: m.propertyPrice,
    downPaymentMode: m.downPaymentMode,
    downPaymentPct: m.downPaymentPct,
    downPaymentAmount: m.downPaymentAmount,
    closingCostsMode: m.closingCostsMode,
    closingCostsPct: m.closingCostsPct,
    closingCostsAmount: m.closingCostsAmount,
  };
}
