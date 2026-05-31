import {
  DestroyRef,
  inject,
  Signal,
  WritableSignal,
  linkedSignal,
  effect,
  untracked,
} from '@angular/core';
import { patchState, signalStoreFeature, withMethods } from '@ngrx/signals';
import { EarlyRepayment, LoanParams } from '../models/mortgage.models';
import {
  CalculatorPersistenceService,
  SignalFormInitOptions,
} from '../services/calculator-persistence.service';

export const MORTGAGE_STORAGE_KEY = 'mortgageCalcState';

export interface MortgagePersistedState {
  inputs: Partial<LoanParams>;
  erList: EarlyRepayment[];
  erCounter: number;
}

/**
 * Creates a custom proxy WritableSignal that links a standard Angular Signal Form
 * to a slice of state in an NgRx SignalStore.
 *
 * It uses Angular's native `linkedSignal` under the hood. Reads are reactively retrieved
 * from the store, and any writes to the signal are reactively synchronized back to the store
 * using an internal effect.
 *
 * @deprecated TODO: Remove this custom adapter when the official NgRx SignalStore RFC for
 * delegatedSignal / withDelegatedSignal is merged and released.
 * Reference RFC: https://github.com/ngrx/platform/issues/5121
 */
export function createStoreWritable<State extends object, Key extends keyof State>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  store: any,
  key: Key,
): WritableSignal<State[Key]> {
  const signalVal = store[key] as Signal<State[Key]>;

  const writable = linkedSignal({
    source: () => signalVal(),
    computation: (src) => src,
  });

  effect(() => {
    const value = writable();
    untracked(() => {
      const currentStoreVal = signalVal();
      if (JSON.stringify(currentStoreVal) !== JSON.stringify(value)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        patchState(store, { [key]: value } as any);
      }
    });
  });

  return writable;
}

/**
 * Reusable NgRx SignalStore feature to manage state persistence and query param state sharing
 * for a calculator's formModel.
 *
 * @deprecated TODO: Remove the custom store feature or update its internals when the official NgRx SignalStore
 * delegated/linked signal RFC is merged and integrated.
 * Reference RFC: https://github.com/ngrx/platform/issues/5121
 */
export function withCalculatorPersistence<T extends object>(
  storageKey: string,
  options?: SignalFormInitOptions<T>,
) {
  return signalStoreFeature(
    { state: { formModel: {} as T } },
    withMethods((store) => {
      const persistence = inject(CalculatorPersistenceService);
      const destroyRef = inject(DestroyRef);

      const formModelWritable = createStoreWritable<{ formModel: T }, 'formModel'>(
        store,
        'formModel',
      );

      return {
        get formModelWritable() {
          return formModelWritable;
        },
        initCalculatorState(): void {
          persistence.initSignalForm(formModelWritable, storageKey, destroyRef, options);
        },
      };
    }),
  );
}

/**
 * Mortgage-specific persistence: localStorage shape `{ inputs, erList, erCounter }`.
 */
export function withMortgagePersistence() {
  return signalStoreFeature(
    {
      state: {
        formModel: {} as LoanParams,
        erList: [] as EarlyRepayment[],
      },
    },
    withMethods((store) => {
      const persistence = inject(CalculatorPersistenceService);
      const destroyRef = inject(DestroyRef);

      const formModelWritable = createStoreWritable<
        { formModel: LoanParams; erList: EarlyRepayment[] },
        'formModel'
      >(store, 'formModel');

      const persistMortgageState = (): void => {
        persistence.saveFormState<MortgagePersistedState>(MORTGAGE_STORAGE_KEY, {
          inputs: store.formModel(),
          erList: store.erList(),
          erCounter: 0,
        });
      };

      return {
        get formModelWritable() {
          return formModelWritable;
        },
        initMortgageState(): void {
          persistence.initSignalForm(formModelWritable, MORTGAGE_STORAGE_KEY, destroyRef, {
            onLoad: (saved) => {
              if (saved['inputs']) {
                patchState(store, {
                  formModel: {
                    ...store.formModel(),
                    ...(saved['inputs'] as Partial<LoanParams>),
                  },
                });
              }
              if (Array.isArray(saved['erList'])) {
                patchState(store, { erList: saved['erList'] as EarlyRepayment[] });
              }
            },
            onSave: () => persistMortgageState(),
          });
        },
        persistMortgageState,
      };
    }),
  );
}
