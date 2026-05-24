import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ShareStateService } from './share-state.service';

describe('ShareStateService', () => {
  let service: ShareStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), ShareStateService],
    });
    service = TestBed.inject(ShareStateService);
  });

  describe('serializeState / deserializeState', () => {
    it('round-trips primitives', () => {
      const qs = service.serializeState({ loanAmount: 100000, erMode: 'reducePmt', flag: true });
      const params = Object.fromEntries(new URLSearchParams(qs));
      const out = service.deserializeState(params);
      expect(out['loanAmount']).toBe(100000);
      expect(out['erMode']).toBe('reducePmt');
      expect(out['flag']).toBe(true);
    });
  });

  describe('loadShareStateIntoRecord', () => {
    it('merges query params into record', () => {
      window.history.pushState({}, '', '/mortgage?loanAmount=200000&loanYears=20');
      const state: Record<string, unknown> = { loanAmount: 100000 };
      const loaded = service.loadShareStateIntoRecord(state);
      expect(loaded).toBe(true);
      expect(state['loanAmount']).toBe(200000);
      expect(state['loanYears']).toBe(20);
      window.history.pushState({}, '', '/');
    });

    it('returns false when no query params', () => {
      window.history.pushState({}, '', '/mortgage');
      const state: Record<string, unknown> = {};
      expect(service.loadShareStateIntoRecord(state)).toBe(false);
      window.history.pushState({}, '', '/');
    });
  });
});
