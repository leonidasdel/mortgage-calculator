import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { DEFAULT_EURIBOR_RATE } from '../constants/euribor.constants';
import { RateFeedService } from './rate-feed.service';

const SAMPLE_ECB_JSON = {
  dataSets: [
    {
      series: {
        '0:0:0:0:0:0:0': {
          observations: { '0': [2.1753] },
        },
      },
    },
  ],
  structure: {
    dimensions: {
      observation: [{ values: [{ id: '2026-04' }] }],
    },
  },
};

describe('RateFeedService', () => {
  let service: RateFeedService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), RateFeedService],
    });
    service = TestBed.inject(RateFeedService);
  });

  async function waitForEuriborValue(): Promise<void> {
    service.euriborResource.reload();
    for (let i = 0; i < 30 && service.euriborResource.value() == null; i++) {
      await new Promise((r) => setTimeout(r, 10));
      await TestBed.tick();
    }
  }

  it('loads rate from ECB when fetch succeeds', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => SAMPLE_ECB_JSON,
    } as Response);

    await waitForEuriborValue();
    expect(service.liveRate()).toBe(2.1753);
    expect(service.asOf()).toBe('2026-04');
    expect(service.usedFallback()).toBe(false);
  });

  it('falls back to default when fetch fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 500 } as Response);

    await waitForEuriborValue();
    expect(service.liveRate()).toBe(DEFAULT_EURIBOR_RATE);
    expect(service.usedFallback()).toBe(true);
  });

  it('toggleUseLiveRate enables live mode', () => {
    service.toggleUseLiveRate(true);
    expect(service.useLiveRate()).toBe(true);
  });
});
