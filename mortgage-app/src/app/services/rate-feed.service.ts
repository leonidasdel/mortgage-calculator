import { computed, Injectable, resource, signal } from '@angular/core';
import { DEFAULT_EURIBOR_RATE, ECB_EURIBOR_3M_URL } from '../constants/euribor.constants';
import { parseEcbEuriborJson } from '../utils/euribor-ecb.util';

export interface EuriborRate {
  rate: number;
  asOf: string;
  source: 'ecb' | 'fallback';
}

@Injectable({ providedIn: 'root' })
export class RateFeedService {
  readonly useLiveRate = signal(false);

  readonly euriborResource = resource({
    loader: async (): Promise<EuriborRate> => {
      try {
        const res = await fetch(ECB_EURIBOR_3M_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const { rate, asOf } = parseEcbEuriborJson(data);
        return { rate, asOf, source: 'ecb' };
      } catch {
        return {
          rate: DEFAULT_EURIBOR_RATE,
          asOf: new Date().toISOString().slice(0, 10),
          source: 'fallback',
        };
      }
    },
  });

  readonly isLoading = computed(() => this.euriborResource.isLoading());
  readonly error = computed(() => this.euriborResource.error());
  readonly liveRate = computed(() => this.euriborResource.value()?.rate ?? null);
  readonly asOf = computed(() => this.euriborResource.value()?.asOf ?? null);
  readonly usedFallback = computed(() => this.euriborResource.value()?.source === 'fallback');

  refreshEuribor(): void {
    this.euriborResource.reload();
  }

  toggleUseLiveRate(enabled: boolean): void {
    this.useLiveRate.set(enabled);
    if (enabled) this.refreshEuribor();
  }
}
