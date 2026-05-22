import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { ShareStateService } from './share-state.service';

export interface CalculatorInitOptions {
  onLoad?: (saved: Record<string, unknown>) => void;
  onSave?: () => void;
  /** Full control when applying URL query params (default: patchValue deserialized state). */
  onApplyShareState?: (state: Record<string, unknown>, form: FormGroup) => void;
  onAfterInit?: () => void;
}

@Injectable({ providedIn: 'root' })
export class CalculatorPersistenceService {
  private shareSvc = inject(ShareStateService);

  saveFormState<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch { /* storage unavailable */ }
  }

  loadFormState<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  initCalculatorForm(
    form: FormGroup,
    storageKey: string,
    destroyRef: DestroyRef,
    options?: CalculatorInitOptions,
  ): void {
    const saved = this.loadFormState<Record<string, unknown>>(storageKey);
    if (saved) {
      if (options?.onLoad) {
        options.onLoad(saved);
      } else {
        form.patchValue(saved, { emitEvent: false });
      }
    }

    const qp = this.shareSvc.getQueryParams();
    if (Object.keys(qp).length) {
      const state = this.shareSvc.deserializeState(qp);
      if (options?.onApplyShareState) {
        options.onApplyShareState(state, form);
      } else {
        form.patchValue(state, { emitEvent: false });
      }
    }

    form.valueChanges.pipe(takeUntilDestroyed(destroyRef)).subscribe(() => {
      if (options?.onSave) {
        options.onSave();
      } else {
        this.saveFormState(storageKey, form.value);
      }
    });

    options?.onAfterInit?.();
  }
}
