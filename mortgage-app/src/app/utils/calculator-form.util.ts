import { DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { form, SchemaOrSchemaFn } from '@angular/forms/signals';
import {
  CalculatorPersistenceService,
  SignalFormInitOptions,
} from '../services/calculator-persistence.service';
import { ProfileFieldBinding } from './merge-profile-defaults.util';

export interface CalculatorFormSetup<T extends object> {
  formModel: WritableSignal<T>;
  formFields: ReturnType<typeof form<T>>;
  destroyRef: DestroyRef;
}

export interface InjectCalculatorFormOptions<T extends object> {
  defaultModel: T | (() => T);
  storageKey: string;
  persistence?: SignalFormInitOptions<T>;
  profileBindings?: ProfileFieldBinding<T>[];
  schema?: SchemaOrSchemaFn<T>;
}

/**
 * Composable setup for tier-2 calculators: formModel signal, signal form fields,
 * and localStorage + URL share persistence via CalculatorPersistenceService.
 *
 * Must be called from an injection context (constructor or field initializer).
 */
export function injectCalculatorForm<T extends object>(
  options: InjectCalculatorFormOptions<T>,
): CalculatorFormSetup<T> {
  const destroyRef = inject(DestroyRef);
  const persistence = inject(CalculatorPersistenceService);

  const defaultModel =
    typeof options.defaultModel === 'function'
      ? (options.defaultModel as () => T)()
      : options.defaultModel;

  const formModel = signal<T>(defaultModel);
  const formFields = options.schema ? form<T>(formModel, options.schema) : form<T>(formModel);

  const persistenceOptions: SignalFormInitOptions<T> = {
    ...options.persistence,
    profileBindings: options.profileBindings ?? options.persistence?.profileBindings,
  };
  persistence.initSignalForm(formModel, options.storageKey, destroyRef, persistenceOptions);

  return { formModel, formFields, destroyRef };
}
