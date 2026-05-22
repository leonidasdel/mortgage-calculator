import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { ShareStateService } from './share-state.service';

describe('ShareStateService', () => {
  let service: ShareStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: {} }],
    });
    service = TestBed.inject(ShareStateService);
  });

  describe('serializeState / deserializeState', () => {
    it('should round-trip primitive values', () => {
      const state = { amount: 100000, rate: 2.5, label: 'test' };
      const qs = service.serializeState(state);
      const parsed = service.deserializeState(Object.fromEntries(new URLSearchParams(qs)));
      expect(parsed).toEqual(state);
    });

    it('should serialize booleans and deserialize them', () => {
      const qs = service.serializeState({ flag: true, off: false });
      const parsed = service.deserializeState(Object.fromEntries(new URLSearchParams(qs)));
      expect(parsed['flag']).toBe(true);
      expect(parsed['off']).toBe(false);
    });

    it('should serialize nested objects as JSON', () => {
      const nested = { items: [{ id: 1 }] };
      const qs = service.serializeState({ data: nested });
      const parsed = service.deserializeState(Object.fromEntries(new URLSearchParams(qs)));
      expect(parsed['data']).toEqual(nested);
    });

    it('should skip null, undefined, and empty string', () => {
      const qs = service.serializeState({ a: null, b: undefined, c: '', d: 1 });
      expect(qs).toBe('d=1');
    });

    it('should coerce numeric strings including leading zeros to numbers', () => {
      const parsed = service.deserializeState({ code: '00123' });
      expect(parsed['code']).toBe(123);
    });

    it('should coerce numeric strings to numbers', () => {
      const parsed = service.deserializeState({ amount: '1500.5' });
      expect(parsed['amount']).toBe(1500.5);
    });
  });

  describe('getQueryParams', () => {
    it('should parse values containing equals signs', () => {
      const original = window.location.href;
      history.replaceState({}, '', '/?formula=a%3Db%26c');
      expect(service.getQueryParams()).toEqual({ formula: 'a=b&c' });
      history.replaceState({}, '', original);
    });
  });

  describe('loadShareStateIntoForm', () => {
    it('should patch form from URL query params', () => {
      const fb = TestBed.inject(FormBuilder);
      const form = fb.group({ amount: [0], mode: ['simple'] });
      const original = window.location.href;
      history.replaceState({}, '', '/?amount=5000&mode=fifo');

      const loaded = service.loadShareStateIntoForm(form);
      expect(loaded).toBe(true);
      expect(form.value).toEqual({ amount: 5000, mode: 'fifo' });

      history.replaceState({}, '', original);
    });

    it('should return false when no query params', () => {
      const fb = TestBed.inject(FormBuilder);
      const form = fb.group({ amount: [0] });
      const original = window.location.href;
      history.replaceState({}, '', '/');

      expect(service.loadShareStateIntoForm(form)).toBe(false);

      history.replaceState({}, '', original);
    });
  });

  describe('buildShareUrl', () => {
    it('should build URL with query string', () => {
      const url = service.buildShareUrl('/mortgage', { loanAmount: 100000 });
      expect(url).toContain('/mortgage?');
      expect(url).toContain('loanAmount=100000');
    });
  });

  describe('whatsAppUrl', () => {
    it('should encode summary and url', () => {
      const url = service.whatsAppUrl('Summary', 'https://example.com');
      expect(url).toContain('https://wa.me/?text=');
      expect(decodeURIComponent(url.split('text=')[1])).toContain('Summary');
    });
  });
});
