/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { damerauLevenshtein, nearestWithinThreshold } from '../edit_distance';

describe('damerauLevenshtein', () => {
  it('is zero for identical strings', () => {
    expect(damerauLevenshtein('where', 'where', 2)).toBe(0);
  });

  it('counts a single substitution as one edit', () => {
    expect(damerauLevenshtein('whare', 'where', 2)).toBe(1);
  });

  it('counts an adjacent transposition as ONE edit (OSA, not plain Levenshtein)', () => {
    expect(damerauLevenshtein('fiedls', 'fields', 2)).toBe(1);
  });

  it('returns length for an empty operand', () => {
    expect(damerauLevenshtein('', 'where', 5)).toBe(5);
    expect(damerauLevenshtein('where', '', 5)).toBe(5);
  });

  it('aborts early past the threshold with a value > maxDistance', () => {
    expect(damerauLevenshtein('zzzzzzzz', 'where', 1)).toBeGreaterThan(1);
  });
});

describe('nearestWithinThreshold', () => {
  it('returns the closest candidate within the threshold', () => {
    expect(nearestWithinThreshold('wherre', ['where', 'fields', 'eval'], 2)).toBe('where');
  });

  it('is case-insensitive on both sides', () => {
    expect(nearestWithinThreshold('WHERE', ['where'], 1)).toBe('where');
  });

  it('returns undefined when nothing is close enough', () => {
    expect(nearestWithinThreshold('zzzzzzzz', ['where', 'fields'], 1)).toBeUndefined();
  });

  it('prefers a distance-0 (case-only) match over an earlier distance-1 one', () => {
    // `ages` (distance 1) appears before `age` (distance 0); the early-out at 0
    // must still let `age` win — it is returned, not `ages`.
    expect(nearestWithinThreshold('AGE', ['ages', 'age'], 2)).toBe('age');
  });

  it('breaks ties by first-seen (strict-less comparison)', () => {
    // Both `aa` and `bb` are distance 1 from `ab`; the first one wins.
    expect(nearestWithinThreshold('ab', ['aa', 'bb'], 1)).toBe('aa');
  });

  it('skips candidates outside the length gap without crashing', () => {
    expect(nearestWithinThreshold('a', ['aaaaaaa'], 1)).toBeUndefined();
  });
});
