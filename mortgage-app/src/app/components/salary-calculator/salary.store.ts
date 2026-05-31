import { computed, DestroyRef, effect, inject, PLATFORM_ID, untracked } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { AgeGroup, SalaryChange } from '../../models/salary.models';
import {
  buildSalaryParams,
  calculateMultiEmployerSalary,
  calculateSalary,
  reverseCalculateSalary,
} from '../../calculators/salary/salary.calc';
import { CalculatorPersistenceService } from '../../services/calculator-persistence.service';
import { createStoreWritable } from '../../utils/store-adapters';

const STORAGE_KEY = 'salaryCalcState';

export interface SalaryModel {
  grossMonthly: number;
  netMonthly: number;
  year: string;
  ageGroup: AgeGroup;
  children: string;
  hasSalaryChange: boolean;
  salaryChangeMonth: string;
  previousGross: number;
  ftePercent: number;
  employer2Gross: number;
  employer3Gross: number;
}

const DEFAULT_MODEL: SalaryModel = {
  grossMonthly: 1500,
  netMonthly: 0,
  year: '2026',
  ageGroup: 'over30',
  children: '0',
  hasSalaryChange: false,
  salaryChangeMonth: '4',
  previousGross: 0,
  ftePercent: 100,
  employer2Gross: 0,
  employer3Gross: 0,
};

export const SalaryStore = signalStore(
  withState({
    formModel: DEFAULT_MODEL,
    annualBonus: 0,
    inputMode: 'gross' as 'gross' | 'net',
    showTaxDetails: false,
    hasSalaryChange: false,
    hasMultiEmployer: false,
    salaryChangeMonth: 4,
    previousGross: 0,
  }),
  withMethods((store) => {
    const persistence = inject(CalculatorPersistenceService);
    const destroyRef = inject(DestroyRef);
    const platformId = inject(PLATFORM_ID);
    const isBrowser = isPlatformBrowser(platformId);

    const formModelWritable = createStoreWritable<
      {
        formModel: SalaryModel;
        annualBonus: number;
        inputMode: 'gross' | 'net';
        showTaxDetails: boolean;
        hasSalaryChange: boolean;
        hasMultiEmployer: boolean;
        salaryChangeMonth: number;
        previousGross: number;
      },
      'formModel'
    >(store, 'formModel');

    const applySavedMeta = (state: Record<string, unknown>): void => {
      if (state['annualBonus'] != null)
        patchState(store, { annualBonus: Number(state['annualBonus']) });
      if (state['hasMultiEmployer'] != null) {
        patchState(store, { hasMultiEmployer: !!state['hasMultiEmployer'] });
      }
      if (state['inputMode']) {
        patchState(store, { inputMode: state['inputMode'] as 'gross' | 'net' });
      }
      const inputs = state['inputs'] as Record<string, unknown> | undefined;
      const hasSalaryChange = inputs?.['hasSalaryChange'] ?? state['hasSalaryChange'];
      const salaryChangeMonth = inputs?.['salaryChangeMonth'] ?? state['salaryChangeMonth'];
      const previousGross = inputs?.['previousGross'] ?? state['previousGross'];
      if (hasSalaryChange != null) {
        patchState(store, { hasSalaryChange: !!hasSalaryChange });
      }
      if (salaryChangeMonth != null) {
        patchState(store, {
          salaryChangeMonth: Math.min(12, Math.max(1, Number(salaryChangeMonth) || 4)),
        });
      }
      if (previousGross != null) {
        patchState(store, { previousGross: Math.max(0, Number(previousGross) || 0) });
      }
    };

    const applySavedFormModel = (
      state: Record<string, unknown>,
      model: typeof formModelWritable,
    ): void => {
      const inputs = state['inputs'] as Record<string, unknown> | undefined;
      if (inputs) {
        model.set({ ...model(), ...inputs } as SalaryModel);
      }
    };

    const saveState = (): void => {
      if (!isBrowser) return;
      const fv = formModelWritable();
      try {
        const salaryChangeMonth = Math.min(12, Math.max(1, Number(fv.salaryChangeMonth) || 4));
        const previousGross = Math.max(0, Number(fv.previousGross) || 0);
        persistence.saveFormState(STORAGE_KEY, {
          inputs: { ...fv, salaryChangeMonth, previousGross },
          annualBonus: store.annualBonus(),
          inputMode: store.inputMode(),
          hasSalaryChange: !!fv.hasSalaryChange,
          hasMultiEmployer: store.hasMultiEmployer(),
          salaryChangeMonth,
          previousGross,
        });
      } catch {
        /* storage unavailable */
      }
    };

    const buildParams = (model: SalaryModel = formModelWritable()) =>
      buildSalaryParams(model, { annualBonus: store.annualBonus() });

    const patchFormModel = (patch: Partial<SalaryModel>): void => {
      formModelWritable.update((m) => ({ ...m, ...patch }));
    };

    const syncFromGross = (grossOverride?: number): void => {
      const base = formModelWritable();
      const model = grossOverride === undefined ? base : { ...base, grossMonthly: grossOverride };
      const r = calculateSalary(buildParams(model));
      const net = r.currentMonthly ? r.currentMonthly.netMonthly : r.netMonthly;
      patchFormModel({ grossMonthly: model.grossMonthly, netMonthly: net });
    };

    const syncCurrentInput = (): void => {
      if (store.inputMode() === 'net') {
        applyNetInput(formModelWritable().netMonthly || 0);
      } else {
        syncFromGross();
      }
    };

    const applyParamChange = (patch: Partial<SalaryModel>): void => {
      const merged = { ...formModelWritable(), ...patch };
      formModelWritable.set(merged);
      if (store.inputMode() === 'net') {
        applyNetInput(merged.netMonthly || 0);
      } else {
        syncFromGross(merged.grossMonthly);
      }
    };

    const applyGrossInput = (gross: number): void => {
      patchState(store, { inputMode: 'gross' });
      syncFromGross(Math.max(0, gross));
    };

    const applyNetInput = (net: number): void => {
      patchState(store, { inputMode: 'net' });
      const fv = formModelWritable();
      const salaryChangeMonth = Math.min(
        12,
        Math.max(1, Number(fv.salaryChangeMonth) || store.salaryChangeMonth() || 4),
      );
      const previousGross = Math.max(0, Number(fv.previousGross) || store.previousGross());
      const salaryChange: SalaryChange | undefined = fv.hasSalaryChange
        ? { effectiveMonth: salaryChangeMonth, previousGross }
        : undefined;
      const gross = reverseCalculateSalary(Math.max(0, net), {
        grossMonthly: fv.grossMonthly,
        year: Number(fv.year) || 2026,
        ageGroup: fv.ageGroup || 'over30',
        children: Math.max(0, Number(fv.children) || 0),
        annualBonus: store.annualBonus(),
        salaryChange,
        ftePercent: Number(fv.ftePercent) || 100,
      });
      patchFormModel({ grossMonthly: gross, netMonthly: Math.max(0, net) });
    };

    let lastSyncedGross = formModelWritable().grossMonthly;
    let lastSyncedNet = formModelWritable().netMonthly;
    const grossNetSyncRef = effect(() => {
      const mode = store.inputMode();
      const { grossMonthly, netMonthly } = formModelWritable();

      untracked(() => {
        if (mode === 'gross' && grossMonthly !== lastSyncedGross) {
          lastSyncedGross = grossMonthly;
          syncFromGross(grossMonthly);
        } else if (mode === 'net' && netMonthly !== lastSyncedNet) {
          lastSyncedNet = netMonthly;
          applyNetInput(netMonthly);
        }
      });

      if (mode !== 'gross') lastSyncedGross = grossMonthly;
      if (mode !== 'net') lastSyncedNet = netMonthly;
    });
    destroyRef.onDestroy(() => grossNetSyncRef.destroy());

    return {
      get formModelWritable() {
        return formModelWritable;
      },
      initSalaryState(): void {
        persistence.initSignalForm(formModelWritable, STORAGE_KEY, destroyRef, {
          onLoad: (saved, model) => {
            applySavedMeta(saved);
            applySavedFormModel(saved, model);
          },
          onSave: () => saveState(),
          onApplyShareState: (state, model) => {
            if (state['annualBonus'] != null) {
              patchState(store, { annualBonus: Number(state['annualBonus']) });
            }
            delete state['annualBonus'];
            model.set({ ...model(), ...state } as SalaryModel);
            syncFromGross();
          },
          onAfterInit: () => syncFromGross(),
        });
      },
      saveState,
      buildParams,
      syncFromGross,
      syncCurrentInput,
      applyParamChange,
      applyGrossInput,
      applyNetInput,
      setAnnualBonus(value: number): void {
        patchState(store, { annualBonus: Math.max(0, value) });
      },
      setInputMode(mode: 'gross' | 'net'): void {
        patchState(store, { inputMode: mode });
      },
      toggleTaxDetails(): void {
        patchState(store, { showTaxDetails: !store.showTaxDetails() });
      },
      setHasSalaryChange(next: boolean): void {
        patchState(store, { hasSalaryChange: next });
        formModelWritable.update((m) => ({ ...m, hasSalaryChange: next }));
      },
      setHasMultiEmployer(next: boolean): void {
        patchState(store, { hasMultiEmployer: next });
      },
      setSalaryChangeMonth(month: number): void {
        const m = Math.min(12, Math.max(1, month));
        patchState(store, { salaryChangeMonth: m });
        formModelWritable.update((fv) => ({ ...fv, salaryChangeMonth: String(m) }));
      },
      setPreviousGross(gross: number): void {
        const prev = Math.max(0, gross);
        patchState(store, { previousGross: prev });
        formModelWritable.update((fv) => ({ ...fv, previousGross: prev }));
      },
      reverseFromNet(netTarget: number): void {
        patchState(store, { inputMode: 'net' });
        applyNetInput(netTarget);
      },
    };
  }),
  withComputed((store) => {
    const buildParams = () =>
      buildSalaryParams(store.formModel(), { annualBonus: store.annualBonus() });

    const result = computed(() => calculateSalary(buildParams()));

    const raiseDiff = computed(() => {
      const r = result();
      if (!r.previousMonthly || !r.currentMonthly) return null;
      const monthly = +(r.currentMonthly.netMonthly - r.previousMonthly.netMonthly).toFixed(2);
      const annual = +(monthly * 14).toFixed(2);
      return { monthly, annual };
    });

    const fullTimeResult = computed(() => {
      const fv = store.formModel();
      const fte = Number(fv.ftePercent) || 100;
      if (fte >= 100) return null;
      return calculateSalary({ ...buildParams(), ftePercent: 100 });
    });

    const multiEmployerResult = computed(() => {
      if (!store.hasMultiEmployer()) return null;
      const fv = store.formModel();
      const grosses = [fv.grossMonthly, fv.employer2Gross, fv.employer3Gross]
        .map((g) => Math.max(0, Number(g) || 0))
        .filter((g) => g > 0);
      if (grosses.length < 2) return null;
      return calculateMultiEmployerSalary({
        grossEmployers: grosses,
        year: Number(fv.year) || 2026,
        ageGroup: fv.ageGroup || 'over30',
        children: Math.max(0, Number(fv.children) || 0),
      });
    });

    const shareState = computed(() => ({
      ...store.formModel(),
      annualBonus: store.annualBonus(),
    }));

    const shareSummary = computed(() => {
      const r = result();
      return `Καθαρά μισθός: €${r.netMonthly.toFixed(2)}/μήνα (${store.formModel().year})`;
    });

    const ageGroupLabel = computed(() => {
      const ag = store.formModel().ageGroup;
      switch (ag) {
        case 'under25':
          return 'Έως 25 ετών';
        case '26to30':
          return '26-30 ετών';
        default:
          return 'Άνω των 30';
      }
    });

    return {
      result,
      raiseDiff,
      fullTimeResult,
      multiEmployerResult,
      shareState,
      shareSummary,
      ageGroupLabel,
    };
  }),
  withHooks({
    onInit(store) {
      store.initSalaryState();
    },
  }),
);
