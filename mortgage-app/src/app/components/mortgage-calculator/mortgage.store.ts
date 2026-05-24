import { computed, DestroyRef, effect, inject, untracked } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { EarlyRepayment, LoanParams } from '../../models/mortgage.models';
import { MortgageCalculatorService } from '../../services/mortgage-calculator.service';
import { PersistenceService } from '../../services/persistence.service';
import { RateFeedService } from '../../services/rate-feed.service';
import { DEFAULT_EURIBOR_RATE } from '../../constants/euribor.constants';
import { createStoreWritable } from '../../utils/store-adapters';

const DEFAULT_LOAN_PARAMS: LoanParams = {
  loanAmount: 100000,
  loanYears: 30,
  fixedYears: 5,
  fixedRate: 2.9,
  euribor: DEFAULT_EURIBOR_RATE,
  bankMargin: 2.1,
  gracePeriod: 0,
  erMode: 'reducePmt',
};

export const MortgageStore = signalStore(
  withState({
    formModel: DEFAULT_LOAN_PARAMS,
    erList: [] as EarlyRepayment[],
  }),
  withMethods((store) => {
    const rateFeed = inject(RateFeedService);
    const persistence = inject(PersistenceService);

    // Create the writable proxy signal for the form
    const formModelWritable = createStoreWritable<{ formModel: LoanParams }, 'formModel'>(
      store,
      'formModel',
    );

    const persist = () => {
      persistence.saveState(store.formModel(), store.erList(), 0);
    };

    return {
      get formModelWritable() {
        return formModelWritable;
      },
      onLiveEuriborToggle(enabled: boolean): void {
        rateFeed.toggleUseLiveRate(enabled);
      },
      onErListChange(updated: EarlyRepayment[]): void {
        patchState(store, { erList: updated });
        persist();
      },
      onErModeChange(mode: 'reducePmt' | 'reduceDur'): void {
        patchState(store, (state) => ({ formModel: { ...state.formModel, erMode: mode } }));
        persist();
      },
      persistState(): void {
        persist();
      },
    };
  }),
  withComputed((store, calc = inject(MortgageCalculatorService)) => {
    const schedule = computed(() => calc.buildSchedule(store.formModel(), store.erList()));
    const baseSchedule = computed(() => calc.buildSchedule(store.formModel(), []));
    const summary = computed(() =>
      calc.computeSummary(schedule(), baseSchedule(), store.formModel()),
    );
    const erMonthsSaved = computed(() =>
      calc.computeErMonthsSaved(store.formModel(), store.erList()),
    );

    const shareSummary = computed(() => {
      const s = summary();
      return `Στεγαστικό δάνειο Salaries.gr: δόση ${s.fixedPayment.toFixed(2)}€ (σταθερή), σύνολο ${s.grandTotal.toFixed(2)}€`;
    });

    return {
      schedule,
      baseSchedule,
      summary,
      erMonthsSaved,
      shareSummary,
    };
  }),
  withHooks({
    onInit(store) {
      const rateFeed = inject(RateFeedService);
      const persistence = inject(PersistenceService);
      const destroyRef = inject(DestroyRef);

      // Initialize the form state from local storage and query params
      persistence.initMortgageForm(store.formModelWritable, destroyRef, {
        onLoadErList: (list) => patchState(store, { erList: list }),
        onSave: () => store.persistState(),
      });

      // Synchronize live rate changes to the store's formModel euribor property
      effect(() => {
        const useLive = rateFeed.useLiveRate();
        const live = rateFeed.liveRate();

        untracked(() => {
          const current = store.formModel();
          if (useLive && live != null) {
            if (current.euribor !== live) {
              patchState(store, { formModel: { ...current, euribor: live } });
            }
          } else if (!useLive && current.euribor === live) {
            patchState(store, { formModel: { ...current, euribor: DEFAULT_EURIBOR_RATE } });
          }
        });
      });
    },
  }),
);
