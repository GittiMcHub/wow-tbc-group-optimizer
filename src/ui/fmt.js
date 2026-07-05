// Compact number display: integers stay bare, fractions get ≤ 2 decimals
// (weighted buff scores are multiples of 0.05 in practice).
export function fmt(x) {
  return String(Math.round(x * 100) / 100);
}
