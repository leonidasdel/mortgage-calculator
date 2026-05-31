import { UserFinancialProfile } from '../models/user-profile.models';

export interface ProfileFieldBinding<T extends object> {
  modelKey: keyof T & string;
  profileKey: keyof UserFinancialProfile;
  /** Map profile value to the calculator model type. */
  toModel?: (profile: UserFinancialProfile) => T[keyof T];
}

function isEmptyModelValue(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (value === '') return true;
  return false;
}

/**
 * Fill calculator model fields from the global profile when the key was not restored
 * from localStorage or URL share state.
 */
export function mergeProfileDefaults<T extends object>(
  model: T,
  profile: UserFinancialProfile,
  bindings: ProfileFieldBinding<T>[],
  excludedKeys: ReadonlySet<string>,
  options?: { overwriteDefaults?: boolean },
): T {
  if (!bindings.length) return model;

  let changed = false;
  const next = { ...model };
  const overwriteDefaults = options?.overwriteDefaults ?? false;

  for (const binding of bindings) {
    if (excludedKeys.has(binding.modelKey)) continue;

    const current = next[binding.modelKey as keyof T];
    if (!overwriteDefaults && !isEmptyModelValue(current)) continue;

    const profileValue = profile[binding.profileKey];
    if (profileValue === undefined) continue;

    const mapped = binding.toModel ? binding.toModel(profile) : (profileValue as T[keyof T]);

    if (isEmptyModelValue(mapped)) continue;

    (next as Record<string, unknown>)[binding.modelKey] = mapped;
    changed = true;
  }

  return changed ? next : model;
}
