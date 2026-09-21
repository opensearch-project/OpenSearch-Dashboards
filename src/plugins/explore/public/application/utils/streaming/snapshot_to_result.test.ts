/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PPLStreamSnapshot } from '../../../../../query_enhancements/common';
import { snapshotRowsToObjects, snapshotToSearchResult } from './snapshot_to_result';

const snapshot = (overrides: Partial<PPLStreamSnapshot> = {}): PPLStreamSnapshot =>
  ({
    status: 'RUNNING',
    schema: [
      { name: '@timestamp', type: 'timestamp' },
      { name: 'event_id', type: 'int' },
    ],
    datarows: [['2026-09-15 10:00:00', 1]],
    size: 1,
    total: 1,
    ...overrides,
  }) as PPLStreamSnapshot;

describe('snapshotRowsToObjects', () => {
  it('zips schema names onto row values', () => {
    expect(snapshotRowsToObjects(snapshot())).toEqual([
      { '@timestamp': '2026-09-15 10:00:00', event_id: 1 },
    ]);
  });

  it('stringifies objects, matching the server-side shim', () => {
    const result = snapshotRowsToObjects({
      schema: [{ name: 'payload', type: 'struct' }],
      datarows: [[{ a: 1 }]],
    } as any);
    expect(result).toEqual([{ payload: '{"a":1}' }]);
  });

  it('stringifies booleans, matching the server-side shim', () => {
    const result = snapshotRowsToObjects({
      schema: [{ name: 'ok', type: 'boolean' }],
      datarows: [[true], [false]],
    } as any);
    expect(result).toEqual([{ ok: 'true' }, { ok: 'false' }]);
  });

  it('preserves null rather than stringifying it', () => {
    const result = snapshotRowsToObjects({
      schema: [{ name: 'maybe', type: 'string' }],
      datarows: [[null]],
    } as any);
    expect(result).toEqual([{ maybe: null }]);
  });

  it('ignores values beyond the schema length', () => {
    const result = snapshotRowsToObjects({
      schema: [{ name: 'a', type: 'int' }],
      datarows: [[1, 'extra']],
    } as any);
    expect(result).toEqual([{ a: 1 }]);
  });

  it('tolerates a missing schema or datarows', () => {
    expect(snapshotRowsToObjects({} as any)).toEqual([]);
    expect(snapshotRowsToObjects({ schema: [{ name: 'a', type: 'int' }] } as any)).toEqual([]);
  });
});

describe('snapshotToSearchResult', () => {
  it('reports the accumulator total, not the number of rows held', () => {
    const result = snapshotToSearchResult({
      snapshot: snapshot({ total: 480954 }),
      rows: [{ event_id: 1 }, { event_id: 2 }],
      elapsedMs: 1200,
    });

    expect(result.hits.total).toBe(480954);
    expect(result.hits.hits).toHaveLength(2);
  });

  it('builds hits with _source and the index name', () => {
    const result = snapshotToSearchResult({
      snapshot: snapshot(),
      rows: [{ event_id: 1 }],
      indexName: 'ppl_logs_large',
      elapsedMs: 10,
    });

    expect(result.hits.hits[0]).toEqual({ _index: 'ppl_logs_large', _source: { event_id: 1 } });
  });

  it('exposes fieldSchema so the table can type columns', () => {
    const result = snapshotToSearchResult({ snapshot: snapshot(), rows: [], elapsedMs: 5 });

    expect(result.fieldSchema).toEqual([
      { name: '@timestamp', type: 'timestamp' },
      { name: 'event_id', type: 'int' },
    ]);
  });

  it('prefers the backend took over measured elapsed time when present', () => {
    const result = snapshotToSearchResult({
      snapshot: snapshot({ took: 5709 }),
      rows: [],
      elapsedMs: 6000,
    });

    expect(result.took).toBe(5709);
    expect(result.elapsedMs).toBe(6000);
  });

  it('falls back to elapsedMs while the query is still running', () => {
    const result = snapshotToSearchResult({ snapshot: snapshot(), rows: [], elapsedMs: 1500 });
    expect(result.took).toBe(1500);
  });

  it('omits aggregations when no histogram is derived', () => {
    const result = snapshotToSearchResult({ snapshot: snapshot(), rows: [], elapsedMs: 5 });
    expect(result.aggregations).toBeUndefined();
  });

  it('attaches a derived histogram under the aggregation id the chart looks for', () => {
    const buckets = [{ key: 1, key_as_string: '1970-01-01T00:00:00.001Z', doc_count: 3 }];
    const result = snapshotToSearchResult({
      snapshot: snapshot(),
      rows: [],
      elapsedMs: 5,
      histogram: { aggId: '2', buckets },
    });

    expect(result.aggregations).toEqual({ 2: { buckets } });
  });
});
