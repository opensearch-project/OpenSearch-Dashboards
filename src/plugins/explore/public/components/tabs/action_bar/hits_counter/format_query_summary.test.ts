/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  formatDuration,
  formatProgressPercent,
  formatStreamingAnnotation,
  getStreamingPhase,
} from './format_query_summary';

describe('formatDuration', () => {
  it('keeps sub-second durations in milliseconds', () => {
    expect(formatDuration(847)).toBe('847 ms');
  });

  it('shows zero as milliseconds rather than 0.000 s', () => {
    expect(formatDuration(0)).toBe('0 ms');
  });

  it('converts a second or more to seconds with three decimals', () => {
    expect(formatDuration(42282)).toBe('42.282 s');
    expect(formatDuration(1000)).toBe('1.000 s');
  });

  it('separates thousands in long millisecond readings', () => {
    expect(formatDuration(999)).toBe('999 ms');
  });

  it('passes undefined through so the caller renders what it did before', () => {
    expect(formatDuration(undefined)).toBe('undefined');
  });
});

describe('getStreamingPhase', () => {
  it('reports none for a non-streaming query', () => {
    expect(getStreamingPhase(undefined)).toBe('none');
  });

  it('reports polling while in flight', () => {
    expect(getStreamingPhase({ isPolling: true } as any)).toBe('polling');
  });

  it('reports aborted when the user stopped it', () => {
    expect(getStreamingPhase({ isPolling: false, aborted: true } as any)).toBe('aborted');
  });

  it('reports completed when it finished on its own', () => {
    expect(getStreamingPhase({ isPolling: false } as any)).toBe('completed');
  });
});

describe('formatProgressPercent', () => {
  it('reports the engine fraction as a percentage', () => {
    expect(formatProgressPercent(0.42)).toBe(42);
  });

  it('floors rather than rounds, so it never reads 100% early', () => {
    expect(formatProgressPercent(0.999)).toBe(99);
  });

  it('reports 0 at the start of a run rather than hiding the percentage', () => {
    expect(formatProgressPercent(0)).toBe(0);
  });

  it('caps at 80 while running, which is all the engine reports until completion', () => {
    // MAX_RUNNING_FRACTION reserves the top 20% for coordinator work the engine cannot measure.
    expect(formatProgressPercent(0.8)).toBe(80);
  });

  it('clamps above 1, should the engine ever overshoot', () => {
    expect(formatProgressPercent(1.2)).toBe(100);
  });

  it.each([
    ['not reported', -1],
    ['absent', undefined],
    ['not a number', NaN],
  ])('returns undefined when no fraction is available (%s)', (_label, fraction) => {
    expect(formatProgressPercent(fraction as number)).toBeUndefined();
  });
});

describe('formatStreamingAnnotation', () => {
  it('adds nothing for a non-streaming query', () => {
    expect(formatStreamingAnnotation(undefined)).toBe('');
  });

  it('shows the engine percentage while polling', () => {
    expect(formatStreamingAnnotation({ isPolling: true, fractionDone: 0.5 } as any)).toBe(' (50%)');
  });

  it('omits the percentage for a plan shape that reports no progress', () => {
    expect(formatStreamingAnnotation({ isPolling: true, fractionDone: -1 } as any)).toBe('');
  });

  it('reports where an aborted query stopped', () => {
    expect(
      formatStreamingAnnotation({ isPolling: false, aborted: true, fractionDone: 0.72 } as any)
    ).toBe(' (Stopped at 72%)');
  });

  it('still reports an abort when there is no percentage to show', () => {
    expect(
      formatStreamingAnnotation({ isPolling: false, aborted: true, fractionDone: -1 } as any)
    ).toBe(' (Stopped)');
  });

  it('leaves a finished streaming query unmarked, since completion says nothing actionable', () => {
    expect(formatStreamingAnnotation({ isPolling: false, total: 5000000 } as any, 5000000)).toBe(
      ''
    );
  });

  it('leaves the fast path unmarked too, so it matches every other finished query', () => {
    expect(formatStreamingAnnotation({ isPolling: false, total: 12 } as any, 12)).toBe('');
  });
});
