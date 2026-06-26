/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Optimal String Alignment (Damerau-Levenshtein restricted to adjacent
 * transpositions). A transposition (`fiedls` -> `fields`) costs 1 edit rather
 * than the 2 plain Levenshtein charges, so transposition typos — one of the most
 * common classes — are caught at a tight threshold of 1. Returns early with a
 * value `> maxDistance` once an entire row exceeds the bound, so the
 * per-keystroke suggestion sweep stays cheap on wide candidate sets.
 *
 * Shared by the command-typo suggester and the field-typo suggester so both rank
 * candidates the same way.
 */
export function damerauLevenshtein(a: string, b: string, maxDistance: number): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  // Three rolling rows: two-back (for transpositions), one-back, current.
  let prevPrev = new Array<number>(n + 1).fill(0);
  let prev = new Array<number>(n + 1);
  let curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let val = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        val = Math.min(val, prevPrev[j - 2] + 1);
      }
      curr[j] = val;
      if (val < rowMin) rowMin = val;
    }
    if (rowMin > maxDistance) {
      return maxDistance + 1;
    }
    const spare = prevPrev;
    prevPrev = prev;
    prev = curr;
    curr = spare;
  }
  return prev[n];
}

/**
 * Nearest candidate to `typed` within `threshold` edits (case-insensitive), or
 * undefined when none is close enough. Iteration order gives a deterministic
 * tie-break (first-seen wins on equal distance); a length-gap pre-filter skips
 * the DP for candidates that can't possibly be within range, and an early-out at
 * distance 0 stops once an exact-but-for-case match is found — nothing can beat
 * it. Comparing with strict `<` keeps the first of equal-distance candidates.
 */
export function nearestWithinThreshold(
  typed: string,
  candidates: Iterable<string>,
  threshold: number
): string | undefined {
  const lower = typed.toLowerCase();
  let best: string | undefined;
  let bestDistance = Infinity;
  for (const candidate of candidates) {
    if (Math.abs(candidate.length - lower.length) > threshold) {
      continue;
    }
    const distance = damerauLevenshtein(lower, candidate.toLowerCase(), threshold);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
      if (bestDistance === 0) {
        break; // Identical after case-normalization; nothing can be closer.
      }
    }
  }
  return best && bestDistance <= threshold ? best : undefined;
}
