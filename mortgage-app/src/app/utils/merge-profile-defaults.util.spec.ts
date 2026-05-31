import { describe, expect, it } from 'vitest';
import { mergeProfileDefaults, ProfileFieldBinding } from './merge-profile-defaults.util';
import { UserFinancialProfile } from '../models/user-profile.models';

interface TestModel {
  grossMonthly: number;
  children: string;
}

const bindings: ProfileFieldBinding<TestModel>[] = [
  { modelKey: 'grossMonthly', profileKey: 'grossMonthly' },
  {
    modelKey: 'children',
    profileKey: 'children',
    toModel: (p) => String(p.children ?? 0),
  },
];

describe('mergeProfileDefaults', () => {
  const profile: UserFinancialProfile = {
    grossMonthly: 2500,
    children: 2,
  };

  it('fills keys not excluded when model values are empty', () => {
    const model: TestModel = { grossMonthly: 0, children: '' };
    const result = mergeProfileDefaults(model, profile, bindings, new Set(), {
      overwriteDefaults: true,
    });
    expect(result.grossMonthly).toBe(2500);
    expect(result.children).toBe('2');
  });

  it('does not overwrite keys restored from localStorage', () => {
    const model: TestModel = { grossMonthly: 1800, children: '' };
    const result = mergeProfileDefaults(model, profile, bindings, new Set(['grossMonthly']));
    expect(result.grossMonthly).toBe(1800);
    expect(result.children).toBe('2');
  });

  it('does not overwrite non-empty model values', () => {
    const model: TestModel = { grossMonthly: 1500, children: '0' };
    const result = mergeProfileDefaults(model, profile, bindings, new Set());
    expect(result.grossMonthly).toBe(1500);
    expect(result.children).toBe('0');
  });

  it('maps children 0 from profile when model children is empty', () => {
    const model: TestModel = { grossMonthly: 1500, children: '' };
    const result = mergeProfileDefaults(
      model,
      { children: 0 },
      bindings,
      new Set(['grossMonthly']),
    );
    expect(result.children).toBe('0');
  });
});
