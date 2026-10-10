/**
 * Utility functions for Maharashtra Farmer Registration & Agri Record Card
 */

/**
 * Formats Land Area in Hectare.Are (क्षेत्र हे.आर)
 * Removes redundant trailing zeros:
 * e.g., 1.440000 -> 1.44
 *       0.620000 -> 0.62
 *       1.130000 -> 1.13
 *       1.030000 -> 1.03
 *       1.400000 -> 1.40
 *       1.000000 -> 1.00
 */
export function formatAreaHaR(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '';
  const str = String(val).trim();
  if (!str) return '';

  const num = parseFloat(str);
  if (isNaN(num)) return str;

  if (str.includes('.')) {
    // Remove extra trailing zeroes
    const trimmed = str.replace(/0+$/, '');
    // If all decimals were zero (e.g. "1.")
    if (trimmed.endsWith('.')) {
      return trimmed + '00';
    }
    const parts = trimmed.split('.');
    // Ensure standard 2 decimal places minimum for Hectare.Are (e.g. 1.4 -> 1.40)
    if (parts[1] && parts[1].length === 1) {
      return trimmed + '0';
    }
    return trimmed;
  }

  // Integer like 1 -> 1.00
  return num.toFixed(2);
}
