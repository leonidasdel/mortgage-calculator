/**
 * Factory for tier-1 calculator NgRx SignalStores.
 *
 * Decision table:
 * - Simple form + one result computed → use injectCalculatorForm() in the component.
 * - Multiple computeds, compare panels, or route-scoped side effects → use signalStore
 *   with withCalculatorPersistence (see consumer-loan.store.ts, savings.store.ts).
 * - Extra persisted state beyond formModel (e.g. erList) → withMortgagePersistence.
 *
 * Prefer explicit signalStore definitions until NgRx improves store factory inference.
 * NgRx delegated-signal RFC #5121 may replace createStoreWritable in store-adapters.ts.
 */
import { Signal } from '@angular/core';
import { signalStore, withComputed, withHooks, withState } from '@ngrx/signals';
import { SignalFormInitOptions } from '../services/calculator-persistence.service';
import { withCalculatorPersistence } from './store-adapters';

export interface CreateCalculatorStoreConfig<TModel extends object> {
  storageKey: string;
  defaultModel: TModel;
  persistenceOptions?: SignalFormInitOptions<TModel>;
  computeds: (store: { formModel: Signal<TModel> }) => Record<string, unknown>;
  onInit?: (store: { initCalculatorState: () => void }) => void;
}

/** @experimental Prefer explicit signalStore + withCalculatorPersistence for full type inference. */
export function createCalculatorStore<TModel extends object>(
  config: CreateCalculatorStoreConfig<TModel>,
) {
  return signalStore(
    withState({ formModel: config.defaultModel }),
    withCalculatorPersistence<TModel>(config.storageKey, config.persistenceOptions),
    withComputed(
      (store) =>
        config.computeds({ formModel: store.formModel as Signal<TModel> }) as Record<
          string,
          ReturnType<typeof import('@angular/core').computed>
        >,
    ),
    withHooks({
      onInit(store) {
        store.initCalculatorState();
        config.onInit?.(store);
      },
    }),
  );
}
