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
    ['days', '2d'],
    ['a negative value', '-5m'],
    ['zero', '0m'],
    ['a trailing dot', '5.h'],
    ['a leading dot', '.5h'],
    ['scientific notation', '1e3h'],
    ['a full-width digit', '５h'],
    ['surrounding text', 'about 5h'],
    ['an empty string', ''],
    ['undefined', undefined],
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

  it('interpolates a gap that fits inside the threshold', () => {
    const result = connectNullGaps(rows, { timeField: 'date', threshold: '1h' });

    // :10 sits 1/3 of the way through the 30m span, so 10 + (30 - 10) / 3
    expect(result[1].a).toBeCloseTo(16.6667, 4);
    // Untouched columns are copied through unchanged
    expect(result.map((row) => row.b)).toEqual([1, 2, 3]);
  });

  it('leaves a gap wider than the threshold alone', () => {
    expect(connectNullGaps(rows, { timeField: 'date', threshold: '5m' })[1].a).toBeNull();
  });

  it('treats a gap exactly on the threshold as connectable', () => {
    // The 30m span is compared with `<=`, so an exact match still bridges
    expect(connectNullGaps(rows, { timeField: 'date', threshold: '30m' })[1].a).toBeCloseTo(
      16.6667,
      4
    );
  });

  it('bridges a multi-row null run in one span', () => {
    const result = connectNullGaps(
      [
        { date: new Date('2023-01-01T00:00:00Z'), a: 0 },
        { date: new Date('2023-01-01T00:15:00Z'), a: null },
        { date: new Date('2023-01-01T00:30:00Z'), a: null },
        { date: new Date('2023-01-01T00:45:00Z'), a: null },
        { date: new Date('2023-01-01T01:00:00Z'), a: 100 },
      ],
      { timeField: 'date', threshold: '2h' }
    );

    expect(result.map((row) => row.a)).toEqual([0, 25, 50, 75, 100]);
  });

  describe('partially connects a long null run', () => {
    // 10m sampling, four consecutive nulls between the valid points at :00 and :50
    const longRun = [
      { date: new Date('2023-01-01T00:00:00Z'), a: 10 },
      { date: new Date('2023-01-01T00:10:00Z'), a: null },
      { date: new Date('2023-01-01T00:20:00Z'), a: null },
      { date: new Date('2023-01-01T00:30:00Z'), a: null },
      { date: new Date('2023-01-01T00:40:00Z'), a: null },
      { date: new Date('2023-01-01T00:50:00Z'), a: 60 },
    ];

    it.each([
      // Each null is judged on its own distance from the last valid point, so the
      // run connects for its leading stretch and breaks past the threshold.
      ['5m', [10, null, null, null, null, 60]],
      ['10m', [10, 20, null, null, null, 60]],
      ['20m', [10, 20, 30, null, null, 60]],
      ['35m', [10, 20, 30, 40, null, 60]],
      ['50m', [10, 20, 30, 40, 50, 60]],
    ])('connects the nulls within %s of the last valid point', (threshold, expected) => {
      const result = connectNullGaps(longRun, { timeField: 'date', threshold });

      expect(result.map((row) => row.a)).toEqual(expected);
    });

    it('judges each run from its own anchor', () => {
      const result = connectNullGaps(
        [
          { date: new Date('2023-01-01T00:00:00Z'), a: 0 },
          { date: new Date('2023-01-01T00:10:00Z'), a: null },
          { date: new Date('2023-01-01T00:20:00Z'), a: null },
          { date: new Date('2023-01-01T00:30:00Z'), a: 30 },
          { date: new Date('2023-01-01T00:40:00Z'), a: null },
          { date: new Date('2023-01-01T00:50:00Z'), a: null },
          { date: new Date('2023-01-01T01:00:00Z'), a: 60 },
        ],
        { timeField: 'date', threshold: '10m' }
      );

      // The threshold restarts at :30, so both runs connect their first null only
      expect(result.map((row) => row.a)).toEqual([0, 10, null, 30, 40, null, 60]);
    });

    it('leaves a trailing run untouched when no valid point closes it', () => {
      const result = connectNullGaps(
        [
          { date: new Date('2023-01-01T00:00:00Z'), a: 10 },
          { date: new Date('2023-01-01T00:10:00Z'), a: null },
          { date: new Date('2023-01-01T00:20:00Z'), a: null },
        ],
        { timeField: 'date', threshold: '1h' }
      );

      // With no end value there is nothing to interpolate toward
      expect(result.map((row) => row.a)).toEqual([10, null, null]);
    });
  });

  it('interpolates unevenly spaced rows by elapsed time, not row position', () => {
    const result = connectNullGaps(
      [
        { date: new Date('2023-01-01T00:00:00Z'), a: 0 },
        { date: new Date('2023-01-01T00:10:00Z'), a: null },
        { date: new Date('2023-01-01T00:40:00Z'), a: null },
        { date: new Date('2023-01-01T01:00:00Z'), a: 60 },
      ],
      { timeField: 'date', threshold: '2h' }
    );

    // 10m and 40m into a 60m span -> 1/6 and 2/3 of the way from 0 to 60
    expect(result.map((row) => row.a)).toEqual([0, 10, 40, 60]);
  });

  it('bridges each series field independently', () => {
    const result = connectNullGaps(
      [
        { date: new Date('2023-01-01T00:00:00Z'), a: 0, b: 100 },
        { date: new Date('2023-01-01T00:30:00Z'), a: null, b: null },
        { date: new Date('2023-01-01T01:00:00Z'), a: 10, b: 200 },
      ],
      { timeField: 'date', threshold: '2h' }
    );

    expect(result[1]).toMatchObject({ a: 5, b: 150 });
  });

  it('leaves leading and trailing nulls in place', () => {
    const result = connectNullGaps(
      [
        { date: new Date('2023-01-01T00:00:00Z'), a: null },
        { date: new Date('2023-01-01T00:10:00Z'), a: 10 },
        { date: new Date('2023-01-01T00:20:00Z'), a: null },
      ],
      { timeField: 'date', threshold: '1h' }
    );

    // Nothing to interpolate between, so both edges stay as breaks
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

  it('bridges the gap in threshold mode', () => {
    const result = connectNullValues(
      { connectNullValues: { connectMode: DisableMode.Threshold, threshold: '2h' } },
      { timeField: 'date' }
    )(rows);

    expect(result[1].a).toBe(5);
  });

  it('falls back to the default threshold when none is configured', () => {
    const result = connectNullValues(
      // The 1h span sits exactly on DEFAULT_GAP_THRESHOLD, so it bridges
      { connectNullValues: { connectMode: DisableMode.Threshold } as any },
      { timeField: 'date' }
    )(rows);

    expect(DEFAULT_GAP_THRESHOLD).toBe('1h');
    expect(result[1].a).toBe(5);
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

  it('falls back to the default threshold when none is configured', () => {
    // The 1h span does not exceed the 1h default, so nothing is inserted
    const result = disconnectValues(
      { disconnectValues: { disableMode: DisableMode.Threshold } as any },
      { timeField: 'date' }
    )(rows);

    expect(result).toHaveLength(2);
  });
});
