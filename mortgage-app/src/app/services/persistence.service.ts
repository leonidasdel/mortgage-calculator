import { DestroyRef, Injectable, inject, WritableSignal } from '@angular/core';
import { EarlyRepayment, LoanParams } from '../models/mortgage.models';
import { CalculatorPersistenceService } from './calculator-persistence.service';

export interface PersistedState {
  inputs: Partial<LoanParams>;
  erList: EarlyRepayment[];
  erCounter: number;
}

const STORAGE_KEY = 'mortgageCalcState';

@Injectable({ providedIn: 'root' })
export class PersistenceService {
  private readonly persistence = inject(CalculatorPersistenceService);

  saveState(inputs: Partial<LoanParams>, erList: EarlyRepayment[], erCounter: number): void {
    const state: PersistedState = { inputs, erList, erCounter };
    this.persistence.saveFormState(STORAGE_KEY, state);
  }

  loadState(): PersistedState | null {
    return this.persistence.loadFormState<PersistedState>(STORAGE_KEY);
  }

  initMortgageForm(
    model: WritableSignal<LoanParams>,
    destroyRef: DestroyRef,
    handlers: {
      onLoadErList: (erList: EarlyRepayment[]) => void;
      onSave: () => void;
    },
  ): void {
    this.persistence.initSignalForm(model, STORAGE_KEY, destroyRef, {
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
