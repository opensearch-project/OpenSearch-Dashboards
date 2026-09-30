/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PPLStreamSnapshot } from '../../../../../query_enhancements/common';
import moment from 'moment';
import { OSD_FIELD_TYPES } from '../../../../../data/common';
import { snapshotRowsToObjects, snapshotToSearchResult } from './snapshot_to_result';

// The formatter the PPL language config registers (see query_enhancements/public/plugin.tsx), so
// these assertions pin the streaming path to what the non-streaming path produces.
const pplFormatter = (value: any, type: OSD_FIELD_TYPES) =>
  type === OSD_FIELD_TYPES.DATE ? moment.utc(value).format('YYYY-MM-DDTHH:mm:ss.SSSZ') : value;

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

  // `createDataFrame` maps the schema through `getFieldType` on the non-streaming path, so the
  // streaming fieldSchema has to report the same mapped types.
  it('maps schema types the way the non-streaming data frame does', () => {
    const result = snapshotToSearchResult({
      snapshot: {
        schema: [
          { name: 'when', type: 'timestamp' },
          { name: 'payload', type: 'struct' },
          { name: 'count', type: 'bigint' },
        ],
        datarows: [],
      } as any,
      rows: [],
      elapsedMs: 1,
    });
    expect(result.fieldSchema).toEqual([
      { name: 'when', type: 'date' },
      { name: 'payload', type: 'object' },
      { name: 'count', type: 'bigint' },
    ]);
  });

  // The PPL search strategy explore uses builds a columnar data frame and never calls
  // `shimSchemaRow`, so these values reach the table unmodified. Stringifying them here is what made
  // structs, geo_point values and arrays render as JSON text.
  it('passes structs through without stringifying them', () => {
    const result = snapshotRowsToObjects({
      schema: [{ name: 'payload', type: 'struct' }],
      datarows: [[{ a: 1 }]],
    } as any);
    expect(result).toEqual([{ payload: { a: 1 } }]);
  });

  it('passes arrays and geo_point values through', () => {
    const result = snapshotRowsToObjects({
      schema: [
        { name: 'tags', type: 'array' },
        { name: 'location', type: 'geo_point' },
      ],
      datarows: [[['a', 'b'], { lat: 1, lon: 2 }]],
    } as any);
    expect(result).toEqual([{ tags: ['a', 'b'], location: { lat: 1, lon: 2 } }]);
  });

  it('keeps booleans as booleans', () => {
    const result = snapshotRowsToObjects({
      schema: [{ name: 'ok', type: 'boolean' }],
      datarows: [[true], [false]],
    } as any);
    expect(result).toEqual([{ ok: true }, { ok: false }]);
  });

  it('preserves null', () => {
    const result = snapshotRowsToObjects({
      schema: [{ name: 'maybe', type: 'string' }],
      datarows: [[null]],
    } as any);
    expect(result).toEqual([{ maybe: null }]);
  });

  describe('date formatting', () => {
    // PPL emits `YYYY-MM-DD HH:MM:SS` in UTC with no offset. Handed to the table raw, it is read as
    // local time and every timestamp shifts by the browser's offset.
    it('formats a timestamp column with an explicit UTC offset', () => {
      const result = snapshotRowsToObjects(snapshot(), pplFormatter);
      expect(result).toEqual([{ '@timestamp': '2026-09-15T10:00:00.000+00:00', event_id: 1 }]);
    });

    it('formats every date column, not just the time field', () => {
      const result = snapshotRowsToObjects(
        {
          schema: [
            { name: 'started', type: 'timestamp' },
            { name: 'ended', type: 'date' },
          ],
          datarows: [['2026-09-15 10:00:00', '2026-09-15 11:30:00']],
        } as any,
        pplFormatter
      );
      expect(result).toEqual([
        { started: '2026-09-15T10:00:00.000+00:00', ended: '2026-09-15T11:30:00.000+00:00' },
      ]);
    });

    // `time` is a time of day with no date, so `getFieldType` leaves it alone on both paths and
    // formatting it as a date would invent one.
    it('does not format a time-of-day column', () => {
      const result = snapshotRowsToObjects(
        { schema: [{ name: 'at', type: 'time' }], datarows: [['10:00:00']] } as any,
        pplFormatter
      );
      expect(result).toEqual([{ at: '10:00:00' }]);
    });

    it('leaves non-date columns untouched', () => {
      const result = snapshotRowsToObjects(
        {
          schema: [
            { name: 'count', type: 'bigint' },
            { name: 'name', type: 'string' },
          ],
          datarows: [[5, '2026-09-15 10:00:00']],
        } as any,
        pplFormatter
      );
      expect(result).toEqual([{ count: 5, name: '2026-09-15 10:00:00' }]);
    });

    it('passes values through when no formatter is supplied', () => {
      expect(snapshotRowsToObjects(snapshot())).toEqual([
        { '@timestamp': '2026-09-15 10:00:00', event_id: 1 },
      ]);
    });
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
      { name: '@timestamp', type: 'date' },
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
