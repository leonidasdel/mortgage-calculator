import { DestroyRef, effect, untracked, WritableSignal } from '@angular/core';
import { syncAnnualFromMonthly, syncMonthlyFromAnnual } from './annual-monthly.util';
import { PctAmountMode, syncPctAmountPair } from './pct-amount-pair.util';

export interface PctAmountPairPaths<T extends object> {
  propertyPrice: keyof T & string;
  mode: keyof T & string;
  pct: keyof T & string;
  amount: keyof T & string;
}

export interface AnnualMonthlyPaths<T extends object> {
  annual: keyof T & string;
  monthly: keyof T & string;
}

function readNum(value: unknown): number {
  return Math.max(0, Number(value) || 0);
}

function readMode(value: unknown): PctAmountMode {
  return value === 'amount' ? 'amount' : 'pct';
}

/** Reactive pct/amount pairs; pass explicit source when mode toggles. */
export function setupPctAmountPairLinks<T extends object>(
  formModel: WritableSignal<T>,
  destroyRef: DestroyRef,
  paths: PctAmountPairPaths<T>,
  options?: { propertyPriceKeys?: (keyof T & string)[] },
): { syncPair: (source: PctAmountMode) => void; syncAllFromPrice: () => void } {
  const priceKeys = options?.propertyPriceKeys ?? [paths.propertyPrice];

  const applyPair = (
    source: PctAmountMode,
    modeKey: keyof T & string,
    pctKey: keyof T & string,
    amountKey: keyof T & string,
  ) => {
    const m = formModel() as Record<string, unknown>;
    const synced = syncPctAmountPair(
      {
        propertyPrice: readNum(m[paths.propertyPrice]),
        mode: String(m[modeKey] ?? 'pct'),
        pct: readNum(m[pctKey]),
        amount: readNum(m[amountKey]),
      },
      source,
    );
    untracked(() => {
      formModel.update((current) => {
        const next = { ...current } as Record<string, unknown>;
        next[pctKey] = synced.pct;
        next[amountKey] = synced.amount;
        return next as T;
      });
    });
  };

  const syncPair = (source: PctAmountMode) =>
    applyPair(source, paths.mode, paths.pct, paths.amount);

  const syncAllFromPrice = () => {
    const m = formModel() as Record<string, unknown>;
    applyPair(readMode(m[paths.mode]), paths.mode, paths.pct, paths.amount);
  };

  let prev = snapshotPriceAndPair(
    formModel() as unknown as Record<string, unknown>,
    paths,
    priceKeys,
  );

  const ref = effect(() => {
    const m = formModel() as Record<string, unknown>;
    const cur = snapshotPriceAndPair(m, paths, priceKeys);
    const priceChanged = priceKeys.some((k) => cur.prices[k] !== prev.prices[k]);

    untracked(() => {
      if (priceChanged) {
        syncAllFromPrice();
      } else if (readMode(m[paths.mode]) === 'pct' && cur.pct !== prev.pct) {
        applyPair('pct', paths.mode, paths.pct, paths.amount);
      } else if (readMode(m[paths.mode]) === 'amount' && cur.amount !== prev.amount) {
        applyPair('amount', paths.mode, paths.pct, paths.amount);
      }
    });

    prev = snapshotPriceAndPair(
      formModel() as unknown as Record<string, unknown>,
      paths,
      priceKeys,
    );
  });

  destroyRef.onDestroy(() => ref.destroy());

  return { syncPair, syncAllFromPrice };
}

function snapshotPriceAndPair<T extends object>(
  m: Record<string, unknown>,
  paths: PctAmountPairPaths<T>,
  priceKeys: (keyof T & string)[],
): { prices: Record<string, number>; pct: number; amount: number } {
  const prices: Record<string, number> = {};
  for (const k of priceKeys) {
    prices[k] = readNum(m[k]);
  }
  return {
    prices,
    pct: readNum(m[paths.pct]),
    amount: readNum(m[paths.amount]),
  };
}

export function setupAnnualMonthlyLinks<T extends object>(
  formModel: WritableSignal<T>,
  destroyRef: DestroyRef,
  paths: AnnualMonthlyPaths<T>,
  incomeMode: () => string,
): void {
  let prevAnnual = readNum((formModel() as Record<string, unknown>)[paths.annual]);
  let prevMonthly = readNum((formModel() as Record<string, unknown>)[paths.monthly]);

  const ref = effect(() => {
    const m = formModel() as Record<string, unknown>;
    const mode = incomeMode();
    const annual = readNum(m[paths.annual]);
    const monthly = readNum(m[paths.monthly]);

    untracked(() => {
      if (mode === 'monthly') {
        if (monthly !== prevMonthly) {
          const synced = syncAnnualFromMonthly(monthly);
          formModel.update(
            (c) =>
              ({
                ...c,
                [paths.annual]: synced.annual,
                [paths.monthly]: synced.monthly,
              }) as T,
          );
        }
      } else if (annual !== prevAnnual) {
        const synced = syncMonthlyFromAnnual(annual);
        formModel.update(
          (c) =>
            ({
              ...c,
              [paths.annual]: synced.annual,
              [paths.monthly]: synced.monthly,
            }) as T,
        );
      }
    });

    prevAnnual = readNum((formModel() as Record<string, unknown>)[paths.annual]);
    prevMonthly = readNum((formModel() as Record<string, unknown>)[paths.monthly]);
  });

  destroyRef.onDestroy(() => ref.destroy());
}
