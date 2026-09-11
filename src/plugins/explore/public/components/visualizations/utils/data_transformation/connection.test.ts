/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  parseThresholdDuration,
  connectNullGaps,
  insertNullGaps,
  connectNullValues,
  disconnectValues,
  DEFAULT_GAP_THRESHOLD,
} from './connection';
import { DisableMode } from '../../types';

describe('parseThresholdDuration', () => {
  it.each([
    ['30s', 30_000],
    ['5m', 300_000],
    ['1h', 3_600_000],
    ['1.5h', 5_400_000],
    ['05m', 300_000],
  ])('parses %s', (input, expected) => {
    expect(parseThresholdDuration(input)).toBe(expected);
  });

  it('tolerates surrounding whitespace, an inner space, and mixed case', () => {
    expect(parseThresholdDuration('  10 M ')).toBe(600_000);
    expect(parseThresholdDuration('5H')).toBe(18_000_000);
  });

  it.each([
    ['a bare number', '5'],
    ['a bare unit', 'h'],
    ['an unsupported unit', '5w'],
    ['milliseconds', '1ms'],
  ])('returns undefined for %s', (_label, input) => {
    expect(parseThresholdDuration(input)).toBeUndefined();
  });
});

describe('connectNullGaps', () => {
  const rows = [
    { date: new Date('2023-01-01T00:00:00Z'), a: 10, b: 1 },
    { date: new Date('2023-01-01T00:10:00Z'), a: null, b: 2 },
    { date: new Date('2023-01-01T00:30:00Z'), a: 30, b: 3 },
  ];

  it('removes a null gap whose valid-to-valid span fits inside the threshold', () => {
    const result = connectNullGaps(rows, {
      timeField: 'date',
      seriesFields: ['a'],
      threshold: '1h',
    });

    // the :10 null sits between valid points 30m apart (<= 1h), so the whole null row is
    // deleted and ECharts joins the neighbours directly — no fabricated point.
    expect(result.map((row) => row.a)).toEqual([10, 30]);
    // deleting the row takes its other columns with it (the :10 b:2 is gone)
    expect(result.map((row) => row.b)).toEqual([1, 3]);
  });

  it('leaves a gap wider than the threshold in place', () => {
    // 30m span > 5m -> nothing removed, the null stays a break
    const result = connectNullGaps(rows, {
      timeField: 'date',
      seriesFields: ['a'],
      threshold: '5m',
    });

    expect(result.map((row) => row.a)).toEqual([10, null, 30]);
  });

  it('treats a span exactly on the threshold as connectable', () => {
    // The 30m span is compared with `<=`, so an exact match still deletes the run
    const result = connectNullGaps(rows, {
      timeField: 'date',
      seriesFields: ['a'],
      threshold: '30m',
    });

    expect(result.map((row) => row.a)).toEqual([10, 30]);
  });

  it('removes a whole multi-row null run when its span fits', () => {
    const result = connectNullGaps(
      [
        { date: new Date('2023-01-01T00:00:00Z'), a: 0 },
        { date: new Date('2023-01-01T00:15:00Z'), a: null },
        { date: new Date('2023-01-01T00:30:00Z'), a: null },
        { date: new Date('2023-01-01T00:45:00Z'), a: null },
        { date: new Date('2023-01-01T01:00:00Z'), a: 100 },
      ],
      { timeField: 'date', seriesFields: ['a'], threshold: '2h' }
    );

    // 1h span <= 2h -> all three nulls deleted, the two valid points join
    expect(result.map((row) => row.a)).toEqual([0, 100]);
  });

  describe('judges a null run all-or-nothing by its valid-to-valid span', () => {
    // four consecutive nulls between the valid points at :00 and :50 (a 50m span)
    const longRun = [
      { date: new Date('2023-01-01T00:00:00Z'), a: 10 },
      { date: new Date('2023-01-01T00:10:00Z'), a: null },
      { date: new Date('2023-01-01T00:20:00Z'), a: null },
      { date: new Date('2023-01-01T00:30:00Z'), a: null },
      { date: new Date('2023-01-01T00:40:00Z'), a: null },
      { date: new Date('2023-01-01T00:50:00Z'), a: 60 },
    ];

    it.each([
      // below the 50m span -> the entire run is kept (no partial connect)
      ['5m', [10, null, null, null, null, 60]],
      ['30m', [10, null, null, null, null, 60]],
      ['49m', [10, null, null, null, null, 60]],
      // at or above the span -> the entire run is removed
      ['50m', [10, 60]],
      ['2h', [10, 60]],
    ])('with threshold %s', (threshold, expected) => {
      const result = connectNullGaps(longRun, {
        timeField: 'date',
        seriesFields: ['a'],
        threshold,
      });

      expect(result.map((row) => row.a)).toEqual(expected);
    });

    it('restarts the span at each valid point, judging runs independently', () => {
      const result = connectNullGaps(
        [
          { date: new Date('2023-01-01T00:00:00Z'), a: 0 },
          { date: new Date('2023-01-01T00:10:00Z'), a: null }, // run 1: :00 -> :20, span 20m
          { date: new Date('2023-01-01T00:20:00Z'), a: 20 },
          { date: new Date('2023-01-01T00:30:00Z'), a: null }, // run 2: :20 -> 1:20, span 60m
          { date: new Date('2023-01-01T00:40:00Z'), a: null },
          { date: new Date('2023-01-01T01:20:00Z'), a: 80 },
        ],
        { timeField: 'date', seriesFields: ['a'], threshold: '30m' }
      );

      // run 1 (20m <= 30m) is removed; run 2 (60m > 30m) is kept whole
      expect(result.map((row) => row.a)).toEqual([0, 20, null, null, 80]);
    });

    it('keeps a trailing run that no valid point closes', () => {
      const result = connectNullGaps(
        [
          { date: new Date('2023-01-01T00:00:00Z'), a: 10 },
          { date: new Date('2023-01-01T00:10:00Z'), a: null },
          { date: new Date('2023-01-01T00:20:00Z'), a: null },
        ],
        { timeField: 'date', seriesFields: ['a'], threshold: '1h' }
      );

      // no closing valid point -> the run is never evaluated, so it stays
      expect(result.map((row) => row.a)).toEqual([10, null, null]);
    });
  });

  it('measures the span by elapsed time, not row count', () => {
    const result = connectNullGaps(
      [
        { date: new Date('2023-01-01T00:00:00Z'), a: 0 },
        { date: new Date('2023-01-01T00:10:00Z'), a: null },
        { date: new Date('2023-01-01T00:40:00Z'), a: null },
        { date: new Date('2023-01-01T01:00:00Z'), a: 60 },
      ],
      { timeField: 'date', seriesFields: ['a'], threshold: '2h' }
    );

    // two unevenly spaced nulls, but only the 1h valid-to-valid span matters (<= 2h) -> both removed
    expect(result.map((row) => row.a)).toEqual([0, 60]);
  });

  it('removes a null row shared across the listed series fields when the span fits', () => {
    const result = connectNullGaps(
      [
        { date: new Date('2023-01-01T00:00:00Z'), a: 0, b: 100 },
        { date: new Date('2023-01-01T00:30:00Z'), a: null, b: null },
        { date: new Date('2023-01-01T01:00:00Z'), a: 10, b: 200 },
      ],
      { timeField: 'date', seriesFields: ['a', 'b'], threshold: '2h' }
    );

    // both a and b span 1h <= 2h, so the shared null row is dropped whole
    expect(result).toEqual([
      { date: new Date('2023-01-01T00:00:00Z'), a: 0, b: 100 },
      { date: new Date('2023-01-01T01:00:00Z'), a: 10, b: 200 },
    ]);
  });

  it('leaves leading and trailing nulls in place', () => {
    const result = connectNullGaps(
      [
        { date: new Date('2023-01-01T00:00:00Z'), a: null },
        { date: new Date('2023-01-01T00:10:00Z'), a: 10 },
        { date: new Date('2023-01-01T00:20:00Z'), a: null },
      ],
      { timeField: 'date', seriesFields: ['a'], threshold: '1h' }
    );

    // a leading null has no anchor before it; a trailing null has no valid point after it
    expect(result.map((row) => row.a)).toEqual([null, 10, null]);
  });
});

describe('insertNullGaps', () => {
  const rows = [
    { date: new Date('2023-01-01T00:00:00Z'), a: 10, b: 1 },
    { date: new Date('2023-01-01T01:00:00Z'), a: 30, b: 3 },
  ];

  it('inserts an all-null row one threshold past the earlier point', () => {
    const result = insertNullGaps(rows, { timeField: 'date', threshold: '10m' });

    expect(result).toHaveLength(3);
    expect(result[1]).toEqual({
      date: new Date('2023-01-01T00:10:00Z'),
      a: null,
      b: null,
    });
  });

  it('leaves a gap within the threshold alone', () => {
    expect(insertNullGaps(rows, { timeField: 'date', threshold: '2h' })).toHaveLength(2);
  });

  it('treats a gap exactly on the threshold as connected', () => {
    // The comparison is strictly `>`, so an exact match inserts nothing
    expect(insertNullGaps(rows, { timeField: 'date', threshold: '1h' })).toHaveLength(2);
  });

  it('inserts an extra null row before a fully missing row', () => {
    const result = insertNullGaps(
      [
        { date: new Date('2023-01-01T00:00:00Z'), a: 10, b: 1 },
        { date: new Date('2023-01-01T01:00:00Z'), a: null, b: null },
      ],
      // 1h gap > 30m -> a break row is inserted at previousTime + 30m (:30)
      { timeField: 'date', threshold: '30m' }
    );

    expect(result).toEqual([
      { date: new Date('2023-01-01T00:00:00Z'), a: 10, b: 1 },
      { date: new Date('2023-01-01T00:30:00Z'), a: null, b: null },
      { date: new Date('2023-01-01T01:00:00Z'), a: null, b: null },
    ]);
  });

  it('breaks every oversized gap', () => {
    const result = insertNullGaps(
      [
        { date: new Date('2023-01-01T00:00:00Z'), a: 1 },
        { date: new Date('2023-01-01T02:00:00Z'), a: 2 },
        { date: new Date('2023-01-01T04:00:00Z'), a: 3 },
      ],
      { timeField: 'date', threshold: '30m' }
    );

    expect(result.map((row) => row.a)).toEqual([1, null, 2, null, 3]);
  });

  it('does not mutate the input array', () => {
    insertNullGaps(rows, { timeField: 'date', threshold: '10m' });

    expect(rows).toHaveLength(2);
  });

  it('preserves the original row objects by reference', () => {
    const result = insertNullGaps(rows, { timeField: 'date', threshold: '10m' });

    expect(result[0]).toBe(rows[0]);
    expect(result[2]).toBe(rows[1]);
  });

  it('accepts string timestamps', () => {
    const result = insertNullGaps(
      [
        { date: '2023-01-01T00:00:00Z', a: 1 },
        { date: '2023-01-01T02:00:00Z', a: 2 },
      ],
      { timeField: 'date', threshold: '30m' }
    );

    expect(result.map((row) => row.a)).toEqual([1, null, 2]);
  });

  it('only nulls the listed series fields on the break row', () => {
    const result = insertNullGaps(rows, {
      timeField: 'date',
      seriesFields: ['a'],
      threshold: '10m',
    });

    // `b` is left off the break row entirely rather than nulled
    expect(result[1]).toEqual({ date: new Date('2023-01-01T00:10:00Z'), a: null });
  });

  it('skips rows whose timestamps cannot be read', () => {
    const result = insertNullGaps(
      [
        { date: 'not a date', a: 1 },
        { date: '2023-01-01T02:00:00Z', a: 2 },
      ],
      { timeField: 'date', threshold: '30m' }
    );

    expect(result).toHaveLength(2);
  });

  it('returns the input untouched when the threshold is unparseable or there is nothing to span', () => {
    expect(insertNullGaps(rows, { timeField: 'date', threshold: 'nope' })).toBe(rows);
    expect(insertNullGaps(rows, { timeField: 'date' })).toBe(rows);
    expect(insertNullGaps([rows[0]], { timeField: 'date', threshold: '10m' })).toHaveLength(1);
    expect(insertNullGaps([], { timeField: 'date', threshold: '10m' })).toEqual([]);
  });
});

describe('connectNullValues', () => {
  const rows = [
    { date: new Date('2023-01-01T00:00:00Z'), a: 0 },
    { date: new Date('2023-01-01T00:30:00Z'), a: null },
    { date: new Date('2023-01-01T01:00:00Z'), a: 10 },
  ];

  it('is a no-op unless the mode is threshold', () => {
    expect(connectNullValues({}, { timeField: 'date' })(rows)).toBe(rows);
    expect(
      connectNullValues(
        { connectNullValues: { connectMode: DisableMode.Never, threshold: '2h' } },
        { timeField: 'date' }
      )(rows)
    ).toBe(rows);
    // `always` is handled by the ECharts flag, not by reshaping the data
    expect(
      connectNullValues(
        { connectNullValues: { connectMode: DisableMode.Always, threshold: '2h' } },
        { timeField: 'date' }
      )(rows)
    ).toBe(rows);
  });

  it('drops the bridgeable null in threshold mode', () => {
    const result = connectNullValues(
      { connectNullValues: { connectMode: DisableMode.Threshold, threshold: '2h' } },
      { timeField: 'date' }
    )(rows);

    // :30 null between :00 and 1:00 (1h span <= 2h) -> the null row is removed
    expect(result.map((row) => row.a)).toEqual([0, 10]);
  });

  it('falls back to the default threshold when none is configured', () => {
    const result = connectNullValues(
      // The 1h span sits exactly on DEFAULT_GAP_THRESHOLD, so the null is removed
      { connectNullValues: { connectMode: DisableMode.Threshold } as any },
      { timeField: 'date' }
    )(rows);

    expect(DEFAULT_GAP_THRESHOLD).toBe('1h');
    expect(result.map((row) => row.a)).toEqual([0, 10]);
  });

  it('forwards the series field scoping', () => {
    const result = connectNullValues(
      { connectNullValues: { connectMode: DisableMode.Threshold, threshold: '2h' } },
      { timeField: 'date', seriesFields: [] }
    )(rows);

    expect(result[1].a).toBeNull();
  });
});

describe('disconnectValues', () => {
  const rows = [
    { date: new Date('2023-01-01T00:00:00Z'), a: 10 },
    { date: new Date('2023-01-01T01:00:00Z'), a: 30 },
  ];

  it('is a no-op unless the mode is threshold', () => {
    expect(disconnectValues({}, { timeField: 'date' })(rows)).toBe(rows);
    expect(
      disconnectValues(
        { disconnectValues: { disableMode: DisableMode.Never, threshold: '10m' } },
        { timeField: 'date' }
      )(rows)
    ).toBe(rows);
  });

  it('inserts a break in threshold mode', () => {
    const result = disconnectValues(
      { disconnectValues: { disableMode: DisableMode.Threshold, threshold: '10m' } },
      { timeField: 'date' }
    )(rows);

    expect(result.map((row) => row.a)).toEqual([10, null, 30]);
  });

  it('adds a break before a null row in threshold mode', () => {
    const result = disconnectValues(
      { disconnectValues: { disableMode: DisableMode.Threshold, threshold: '30m' } },
      { timeField: 'date' }
    )([
      { date: new Date('2023-01-01T00:00:00Z'), a: 10 },
      { date: new Date('2023-01-01T01:00:00Z'), a: null },
    ]);

    // 1h gap > 30m -> break row inserted at :30 before the fully-null 1:00 row
    expect(result.map((row) => row.a)).toEqual([10, null, null]);
    expect(result[1].date).toEqual(new Date('2023-01-01T00:30:00Z'));
  });

  it('falls back to the default threshold when none is configured', () => {
    // The 1h span does not exceed the 1h default, so nothing is inserted
    const result = disconnectValues(
      { disconnectValues: { disableMode: DisableMode.Threshold } as any },
      { timeField: 'date' }
    )(rows);

    expect(result).toHaveLength(2);
  });
});
