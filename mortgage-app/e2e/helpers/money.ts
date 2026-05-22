/** Round to 2 decimal places (cent precision). */
export function roundEuro(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Format like EuroPipe: €1,234.56 */
export function formatEuro(value: number, decimals = 2): string {
  return '€' + value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
