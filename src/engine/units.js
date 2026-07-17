/*
  Unit formatting helpers — consistent numeric + unit-notation formatting
  used by <unit-label>, <sim-value-display>, and any future chapter code
  printing a physics quantity.
*/

const SUPERSCRIPT_DIGITS = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '-': '⁻' };

/**
 * Formats a unit string with proper notation: "m/s^2" -> "m/s²",
 * "kg*m/s" -> "kg·m/s", "m^-1" -> "m⁻¹".
 */
export function formatUnit(unit) {
  if (!unit) return '';
  return unit
    .replace(/\*/g, '·')
    .replace(/\^(-?\d+)/g, (_, exponent) =>
      String(exponent)
        .split('')
        .map((ch) => SUPERSCRIPT_DIGITS[ch] ?? ch)
        .join('')
    );
}

/**
 * Formats a numeric value to `precision` significant decimal places,
 * trimming trailing zeros, with an optional unit appended (space-separated).
 */
export function formatQuantity(value, unit = '', { precision = 2 } = {}) {
  if (!Number.isFinite(value)) return '—';
  const rounded = Number(value.toFixed(precision));
  const numberText = rounded.toLocaleString(undefined, { maximumFractionDigits: precision });
  const unitText = formatUnit(unit);
  return unitText ? `${numberText} ${unitText}` : numberText;
}
