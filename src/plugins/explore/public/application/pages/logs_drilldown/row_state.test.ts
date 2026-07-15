/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LogRowState, deriveRowState, isDead, formatRangeLabel } from './row_state';

describe('deriveRowState', () => {
  const base = { kind: 'index' as const, hasResult: false, hasError: false };

  it('NO_TIME_FIELD wins over everything (even an error/empty)', () => {
    expect(deriveRowState({ ...base, isNoTimeField: true, hasError: true, docsCount: 0 })).toBe(
      LogRowState.NO_TIME_FIELD
    );
  });

  it('ERROR wins over empty/no-recent', () => {
    expect(deriveRowState({ ...base, hasError: true, docsCount: 0 })).toBe(LogRowState.ERROR);
    expect(
      deriveRowState({ ...base, hasError: true, hasResult: true, histogramTotalsSum: 0 })
    ).toBe(LogRowState.ERROR);
  });

  it('EMPTY_INDEX fires only on an explicit docsCount === 0', () => {
    expect(deriveRowState({ ...base, docsCount: 0 })).toBe(LogRowState.EMPTY_INDEX);
    // undefined (remote/closed/unknown) must NOT be treated as empty.
    expect(deriveRowState({ ...base, docsCount: undefined })).toBe(LogRowState.LOADING);
  });

  it('NO_RECENT requires a resolved histogram summing to zero', () => {
    expect(deriveRowState({ ...base, docsCount: 42, hasResult: true, histogramTotalsSum: 0 })).toBe(
      LogRowState.NO_RECENT
    );
    // No result yet → still loading, not no-recent.
    expect(deriveRowState({ ...base, docsCount: 42, hasResult: false })).toBe(LogRowState.LOADING);
  });

  it('LOADING when unresolved and not otherwise classified', () => {
    expect(deriveRowState({ ...base, docsCount: 10 })).toBe(LogRowState.LOADING);
  });

  it('FULL when resolved with events in range', () => {
    expect(
      deriveRowState({ ...base, docsCount: 10, hasResult: true, histogramTotalsSum: 128 })
    ).toBe(LogRowState.FULL);
  });

  it('datasets are never treated as no-time-field even if the flag leaks', () => {
    expect(
      deriveRowState({
        kind: 'dataset',
        isNoTimeField: true,
        hasResult: true,
        hasError: false,
        histogramTotalsSum: 5,
      })
    ).toBe(LogRowState.FULL);
  });
});

describe('isDead', () => {
  it('NO_RECENT and EMPTY_INDEX are dead; others are not', () => {
    expect(isDead(LogRowState.NO_RECENT)).toBe(true);
    expect(isDead(LogRowState.EMPTY_INDEX)).toBe(true);
    expect(isDead(LogRowState.LOADING)).toBe(false);
    expect(isDead(LogRowState.FULL)).toBe(false);
    expect(isDead(LogRowState.ERROR)).toBe(false);
    expect(isDead(LogRowState.NO_TIME_FIELD)).toBe(false);
  });
});

describe('formatRangeLabel', () => {
  it('humanizes common spans', () => {
    const from = Date.parse('2026-07-15T00:00:00Z');
    expect(formatRangeLabel(from, from + 15 * 60 * 1000)).toBe('15 minutes');
    expect(formatRangeLabel(from, from + 24 * 60 * 60 * 1000)).toBe('a day');
  });

  it('returns empty for a non-positive or invalid span', () => {
    expect(formatRangeLabel(100, 100)).toBe('');
    expect(formatRangeLabel(200, 100)).toBe('');
    expect(formatRangeLabel(NaN, 100)).toBe('');
  });
});
