/** Fallback when ECB fetch fails (matches historical default in mortgage form). */
export const DEFAULT_EURIBOR_RATE = 2.1;

/** Euribor 3M monthly — ECB Data Portal, no API key. */
export const ECB_EURIBOR_3M_URL =
  'https://data-api.ecb.europa.eu/service/data/FM/M.U2.EUR.RT.MM.EURIBOR3MD_.HSTA?lastNObservations=1&detail=dataonly&format=jsondata';
