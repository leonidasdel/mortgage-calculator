import { Injectable } from '@angular/core';
import { EarlyRepayment, LoanParams } from '../models/mortgage.models';

export interface PersistedState {
  inputs: Partial<LoanParams>;
  erList: EarlyRepayment[];
  erCounter: number;
}

const STORAGE_KEY = 'mortgageCalcState';

@Injectable({ providedIn: 'root' })
export class PersistenceService {

  saveState(inputs: Partial<LoanParams>, erList: EarlyRepayment[], erCounter: number): void {
    try {
      const state: PersistedState = { inputs, erList, erCounter };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch { /* storage unavailable */ }
  }

  loadState(): PersistedState | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as PersistedState;
    } catch {
      return null;
    }
  }
}
