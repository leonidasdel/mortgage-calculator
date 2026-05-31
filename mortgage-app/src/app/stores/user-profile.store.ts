import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { USER_PROFILE_STORAGE_KEY, UserFinancialProfile } from '../models/user-profile.models';

const EMPTY_PROFILE: UserFinancialProfile = {};

export const UserProfileStore = signalStore(
  { providedIn: 'root' },
  withState({ profile: EMPTY_PROFILE }),
  withMethods((store) => {
    const platformId = inject(PLATFORM_ID);
    const isBrowser = isPlatformBrowser(platformId);

    const persist = (): void => {
      if (!isBrowser) return;
      try {
        localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(store.profile()));
      } catch {
        /* storage unavailable */
      }
    };

    return {
      loadProfile(): void {
        if (!isBrowser) return;
        try {
          const raw = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
          if (!raw) return;
          patchState(store, { profile: JSON.parse(raw) as UserFinancialProfile });
        } catch {
          /* ignore */
        }
      },
      patchProfile(partial: Partial<UserFinancialProfile>): void {
        patchState(store, { profile: { ...store.profile(), ...partial } });
        persist();
      },
      clearProfile(): void {
        patchState(store, { profile: {} });
        persist();
      },
    };
  }),
  withHooks({
    onInit(store) {
      store.loadProfile();
    },
  }),
);
