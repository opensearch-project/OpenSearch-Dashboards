/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PPLStreamSnapshot } from '../../../../../query_enhancements/common';
import { ISearchResult } from '../state_management/slices';
import type { HistogramBucket } from './snapshot_to_histogram';

/**
 * Converts a streaming PPL snapshot into the `ISearchResult` the results table already renders.
 *
 * The synchronous path reaches the same shape via the server search strategy and
 * `convertResult`, but streaming bypasses `SearchSource` (which has no observable `fetch$`), so the
 * conversion happens here instead. Any change to the hit structure in
 * `data/common/data_frames/utils.ts` must be mirrored.
 */

/** Mirrors the coercion `shimSchemaRow` applies server-side, so cells render identically. */
const coerceCell = (value: unknown): unknown => {
  if (value !== null && typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'boolean') return value.toString();
  return value;
};

export const snapshotRowsToObjects = (
  snapshot: Pick<PPLStreamSnapshot, 'schema' | 'datarows'>
): Array<Record<string, unknown>> => {
  const names = (snapshot.schema ?? []).map((column) => column.name);
  return (snapshot.datarows ?? []).map((row) =>
    names.reduce<Record<string, unknown>>((record, name, index) => {
      if (index < row.length) {
        record[name] = coerceCell(row[index]);
      }
      return record;
    }, {})
  );
};

export interface SnapshotToSearchResultArgs {
  snapshot: PPLStreamSnapshot;
  /** Rows held by the client, which may span more snapshots than `snapshot.datarows`. */
  rows: Array<Record<string, unknown>>;
  indexName?: string;
  elapsedMs: number;
  /**
   * Histogram buckets, keyed by the aggregation id from the histogram config so the chart finds them
   * where it expects.
   */
  histogram?: { aggId: string; buckets: HistogramBucket[] };
  /**
   * Overrides `hits.total`. Needed for the derived-histogram result: the chart renders nothing when
   * `hits.total` is falsy, and it should report the bucketed count rather than the accumulator size.
   */
  totalOverride?: number;
}

export const snapshotToSearchResult = ({
  snapshot,
  rows,
  indexName,
  elapsedMs,
  histogram,
  totalOverride,
}: SnapshotToSearchResultArgs): ISearchResult => {
  const result = {
    took: snapshot.took ?? elapsedMs,
    timed_out: false,
    _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
    hits: {
      // The accumulator size, not `rows.length`: the point of streaming is to report how many rows
      // exist while showing only a window of them.
      total: totalOverride ?? snapshot.total ?? rows.length,
      max_score: 0,
      hits: rows.map((source) => ({ _index: indexName, _source: source })),
    },
    elapsedMs,
    fieldSchema: (snapshot.schema ?? []).map((column) => ({
      name: column.name,
      type: column.type,
    })),
  } as ISearchResult;

  if (histogram) {
    result.aggregations = {
      [histogram.aggId]: { buckets: histogram.buckets },
    };
  }

  return result;
};
