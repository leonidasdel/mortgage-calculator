import { DestroyRef, effect, inject, Injectable, Injector, runInInjectionContext, untracked, WritableSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { ShareStateService } from './share-state.service';

export interface CalculatorInitOptions {
  onLoad?: (saved: Record<string, unknown>) => void;
  onSave?: () => void;
  /** Full control when applying URL query params (default: patchValue deserialized state). */
  onApplyShareState?: (state: Record<string, unknown>, form: FormGroup) => void;
  onAfterInit?: () => void;
}

export interface SignalFormInitOptions<T> {
  onLoad?: (saved: Record<string, unknown>) => void;
  onSave?: (value: T) => void;
  onApplyShareState?: (state: Record<string, unknown>, model: WritableSignal<T>) => void;
  onAfterInit?: () => void;
}

@Injectable({ providedIn: 'root' })
export class CalculatorPersistenceService {
  private readonly shareSvc = inject(ShareStateService);
  private readonly injector = inject(Injector);

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

    runInInjectionContext(this.injector, () => {
      const formValues = toSignal(form.valueChanges, { initialValue: form.value });
      const saveRef = effect(() => {
        formValues();
        untracked(() => {
          if (options?.onSave) {
            options.onSave();
          } else {
            this.saveFormState(storageKey, form.value);
          }
        });
      });
      destroyRef.onDestroy(() => saveRef.destroy());
    });

    options?.onAfterInit?.();
  }

  initSignalForm<T extends object>(
    model: WritableSignal<T>,
    storageKey: string,
    destroyRef: DestroyRef,
    options?: SignalFormInitOptions<T>,
  ): void {
    const saved = this.loadFormState<Record<string, unknown>>(storageKey);
    if (saved) {
      if (options?.onLoad) {
        options.onLoad(saved);
      } else {
        model.set({ ...model(), ...saved } as T);
      }
    }

    const qp = this.shareSvc.getQueryParams();
    if (Object.keys(qp).length) {
      const state = this.shareSvc.deserializeState(qp);
      if (options?.onApplyShareState) {
        options.onApplyShareState(state, model);
      } else {
        model.set({ ...model(), ...state } as T);
      }
    }

    let prevJson = JSON.stringify(model());
    runInInjectionContext(this.injector, () => {
      const persistRef = effect(() => {
        const value = model();
        const json = JSON.stringify(value);
        if (json === prevJson) return;
        prevJson = json;
        untracked(() => {
          if (options?.onSave) {
            options.onSave(value);
          } else {
            this.saveFormState(storageKey, value);
          }
        });
      });
      destroyRef.onDestroy(() => persistRef.destroy());
    });

    options?.onAfterInit?.();
  }
}
