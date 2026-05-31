import { TestBed } from '@angular/core/testing';
import { UserProfileStore } from './user-profile.store';
import { USER_PROFILE_STORAGE_KEY } from '../models/user-profile.models';

describe('UserProfileStore', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('persists profile patches to localStorage', () => {
    const store = TestBed.inject(UserProfileStore);
    store.patchProfile({ grossMonthly: 2200, children: 1 });

    const raw = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!) as { grossMonthly: number; children: number };
    expect(parsed.grossMonthly).toBe(2200);
    expect(parsed.children).toBe(1);
  });

  it('clears profile from storage', () => {
    const store = TestBed.inject(UserProfileStore);
    store.patchProfile({ grossMonthly: 1800 });
    store.clearProfile();
    expect(localStorage.getItem(USER_PROFILE_STORAGE_KEY)).toBe('{}');
  });
});
