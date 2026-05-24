import { DestroyRef, effect, inject, Injectable, Injector, PLATFORM_ID, runInInjectionContext, untracked, WritableSignal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ShareStateService } from './share-state.service';

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
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  saveFormState<T>(key: string, value: T): void {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch { /* storage unavailable */ }
  }

  loadFormState<T>(key: string): T | null {
    if (!this.isBrowser) return null;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
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
