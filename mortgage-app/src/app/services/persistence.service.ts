import { DestroyRef, Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
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
  constructor(private persistence: CalculatorPersistenceService) {}

  saveState(inputs: Partial<LoanParams>, erList: EarlyRepayment[], erCounter: number): void {
    const state: PersistedState = { inputs, erList, erCounter };
    this.persistence.saveFormState(STORAGE_KEY, state);
  }

  loadState(): PersistedState | null {
    return this.persistence.loadFormState<PersistedState>(STORAGE_KEY);
  }

  initMortgageForm(
    form: FormGroup,
    destroyRef: DestroyRef,
    handlers: {
      onLoadErList: (erList: EarlyRepayment[]) => void;
      onSave: () => void;
    },
  ): void {
    this.persistence.initCalculatorForm(form, STORAGE_KEY, destroyRef, {
      onLoad: (saved) => {
        if (saved['inputs']) {
          form.patchValue(saved['inputs'] as Record<string, unknown>, { emitEvent: false });
        }
        if (Array.isArray(saved['erList'])) {
          handlers.onLoadErList(saved['erList'] as EarlyRepayment[]);
        }
      },
      onSave: handlers.onSave,
    });
  }
}
