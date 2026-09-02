/** Indian-format money used by the pricing estimator.
 *  ₹35k, ₹1.4L … matches the design exactly. */
export function money(n: number): string {
  if (n >= 100000) {
    const l = n / 100000;
    return "₹" + (l % 1 === 0 ? l : l.toFixed(1)) + "L";
  }
  return "₹" + Math.round(n / 1000) + "k";
}

export function band(lo: number, hi: number): string {
  return money(lo) + "–" + money(hi);
}
