export interface ParsedEuriborObservation {
  rate: number;
  asOf: string;
}

/** Parse ECB SDMX-JSON (format=jsondata) for Euribor 3M series. */
export function parseEcbEuriborJson(data: unknown): ParsedEuriborObservation {
  const root = data as {
    dataSets?: { series?: Record<string, { observations?: Record<string, number[]> }> }[];
    structure?: {
      dimensions?: {
        observation?: { values?: { id?: string }[] }[];
      };
    };
  };

  const seriesMap = root.dataSets?.[0]?.series;
  if (!seriesMap) throw new Error('ECB response missing series');

  const firstSeries = Object.values(seriesMap)[0];
  const obs = firstSeries?.observations;
  if (!obs) throw new Error('ECB response missing observations');

  const firstKey = Object.keys(obs)[0];
  const raw = obs[firstKey]?.[0];
  const rate = Number(raw);
  if (!Number.isFinite(rate) || rate < 0) throw new Error('ECB response has invalid rate');

  const periodId = root.structure?.dimensions?.observation?.[0]?.values?.[0]?.id;
  const asOf = periodId ?? new Date().toISOString().slice(0, 10);

  return { rate, asOf };
}
