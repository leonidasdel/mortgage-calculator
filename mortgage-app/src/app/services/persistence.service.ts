import { DestroyRef, Injectable, inject, WritableSignal } from '@angular/core';
import { EarlyRepayment, LoanParams } from '../models/mortgage.models';
import { CalculatorPersistenceService } from './calculator-persistence.service';
import { MORTGAGE_STORAGE_KEY, MortgagePersistedState } from '../utils/store-adapters';

export type { MortgagePersistedState as PersistedState };

/** @deprecated Prefer MortgageStore with withMortgagePersistence; kept for legacy callers. */
@Injectable({ providedIn: 'root' })
export class PersistenceService {
  private readonly persistence = inject(CalculatorPersistenceService);

  saveState(inputs: Partial<LoanParams>, erList: EarlyRepayment[], erCounter: number): void {
    const state: MortgagePersistedState = { inputs, erList, erCounter };
    this.persistence.saveFormState(MORTGAGE_STORAGE_KEY, state);
  }

  loadState(): MortgagePersistedState | null {
    return this.persistence.loadFormState<MortgagePersistedState>(MORTGAGE_STORAGE_KEY);
  }

  initMortgageForm(
    model: WritableSignal<LoanParams>,
    destroyRef: DestroyRef,
    handlers: {
      onLoadErList: (erList: EarlyRepayment[]) => void;
      onSave: () => void;
    },
  ): void {
    this.persistence.initSignalForm(model, MORTGAGE_STORAGE_KEY, destroyRef, {
      onLoad: (saved) => {
        if (saved['inputs']) {
          model.set({ ...model(), ...(saved['inputs'] as Partial<LoanParams>) });
        }
        if (Array.isArray(saved['erList'])) {
          handlers.onLoadErList(saved['erList'] as EarlyRepayment[]);
        }
      },
      onSave: () => handlers.onSave(),
    });
  }
}
