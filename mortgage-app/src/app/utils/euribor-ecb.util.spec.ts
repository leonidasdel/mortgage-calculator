import { parseEcbEuriborJson } from './euribor-ecb.util';

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

describe('parseEcbEuriborJson', () => {
  it('extracts rate and period from ECB jsondata', () => {
    const result = parseEcbEuriborJson(SAMPLE_ECB_JSON);
    expect(result.rate).toBe(2.1753);
    expect(result.asOf).toBe('2026-04');
  });

  it('throws when series is missing', () => {
    expect(() => parseEcbEuriborJson({ dataSets: [{}] })).toThrow(/series/i);
  });
});
