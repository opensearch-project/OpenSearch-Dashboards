/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { snapshotToHistogramBuckets } from './snapshot_to_histogram';

/** Mirrors a real `stats count() by span(@timestamp, 1h)` snapshot. */
const snap = (datarows: unknown[][], schema?: Array<{ name: string; type: string }>) =>
  ({
    status: 'RUNNING',
    schema: schema ?? [
      { name: 'count()', type: 'bigint' },
      { name: 'span(`@timestamp`,1h)', type: 'timestamp' },
    ],
    datarows,
    size: datarows.length,
    total: datarows.length,
  }) as any;

describe('snapshotToHistogramBuckets', () => {
  it('converts count/bucket rows into chart buckets', () => {
    const buckets = snapshotToHistogramBuckets(
      snap([
        [58823, '2026-09-14 19:00:00'],
        [211765, '2026-09-14 20:00:00'],
      ])
    );

    expect(buckets).toEqual([
      {
        key: Date.UTC(2026, 8, 14, 19),
        key_as_string: '2026-09-14T19:00:00.000Z',
        doc_count: 58823,
      },
      {
        key: Date.UTC(2026, 8, 14, 20),
        key_as_string: '2026-09-14T20:00:00.000Z',
        doc_count: 211765,
      },
    ]);
  });

  it('sorts ascending, since composite pages arrive unordered', () => {
    const buckets = snapshotToHistogramBuckets(
      snap([
        [3, '2026-09-14 21:00:00'],
        [1, '2026-09-14 19:00:00'],
        [2, '2026-09-14 20:00:00'],
      ])
    );
    expect(buckets.map((b) => b.doc_count)).toEqual([1, 2, 3]);
  });

  it('identifies the bucket column by type, whichever position it is in', () => {
    const buckets = snapshotToHistogramBuckets(
      snap(
        [['2026-09-14 19:00:00', 42]],
        [
          { name: 'span(`@timestamp`,1h)', type: 'timestamp' },
          { name: 'count()', type: 'bigint' },
        ]
      )
    );
    expect(buckets).toEqual([
      { key: Date.UTC(2026, 8, 14, 19), key_as_string: '2026-09-14T19:00:00.000Z', doc_count: 42 },
    ]);
  });

  it('parses the PPL timestamp as UTC, not local time', () => {
    const [bucket] = snapshotToHistogramBuckets(snap([[1, '2026-09-14 19:00:00']]));
    expect(bucket.key).toBe(Date.UTC(2026, 8, 14, 19));
  });

  it('skips rows whose bucket cannot be parsed', () => {
    const buckets = snapshotToHistogramBuckets(
      snap([
        [1, 'not a date'],
        [2, '2026-09-14 20:00:00'],
      ])
    );
    expect(buckets).toHaveLength(1);
    expect(buckets[0].doc_count).toBe(2);
  });

  it('treats a non-numeric count as zero rather than NaN', () => {
    const [bucket] = snapshotToHistogramBuckets(snap([['oops', '2026-09-14 19:00:00']] as any));
    expect(bucket.doc_count).toBe(0);
  });

  it('returns empty for an empty or single-column snapshot', () => {
    expect(snapshotToHistogramBuckets(snap([]))).toEqual([]);
    expect(snapshotToHistogramBuckets(snap([[1]], [{ name: 'count()', type: 'bigint' }]))).toEqual(
      []
    );
  });
});
