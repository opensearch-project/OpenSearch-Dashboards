/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * Converts a streaming PPL snapshot into the `ISearchResult` the results table already renders.
 *
 * The synchronous path reaches the same shape through the server search strategy (`createDataFrame`)
 * and the client's `convertResult`, but streaming bypasses `SearchSource`, which has no observable
 * `fetch$`. This reproduces that pipeline's two observable behaviours:
 *
 * - Field types are mapped with the same `getFieldType`, so `timestamp` becomes `date` and `struct`
 *   becomes `object`.
 * - Date values go through the language formatter, which renders the PPL wire format as an ISO
 *   string with an explicit offset. Without it the table treats `2026-09-29 12:34:56` as local time
 *   and shifts every timestamp by the browser's UTC offset.
 *
 * Values of other types are passed through untouched, exactly as `convertResult` does. Note the
 * server's `shimSchemaRow` stringifies booleans and objects, but the PPL search strategy explore
 * uses does not call it — mirroring it here is what made booleans, structs, `geo_point` values and
 * arrays arrive as strings.
 */

import { getFieldType, OSD_FIELD_TYPES } from '../../../../../data/common';
import type { PPLStreamSnapshot } from '../../../../../query_enhancements/common';
import { ISearchResult } from '../state_management/slices';
import type { HistogramBucket } from './snapshot_to_histogram';

/** Formats one field value, as `convertResult`'s `processField` does. */
export type FieldValueFormatter = (value: any, type: OSD_FIELD_TYPES) => any;

/**
 * Search highlights arrive as an extra `_highlight` data column rather than envelope metadata. The
 * synchronous strategy splices it out of the schema and rows before building the data frame and
 * attaches it per hit; the same is done here so the column does not render as a field.
 */
const HIGHLIGHT_COLUMN = '_highlight';

const highlightIndex = (schema: PPLStreamSnapshot['schema'] = []): number =>
  schema.findIndex((column) => column.name === HIGHLIGHT_COLUMN);

/** Per-row highlights, and the rows with that column removed. */
export const splitHighlightColumn = (
  snapshot: Pick<PPLStreamSnapshot, 'schema' | 'datarows'>
): { datarows: unknown[][]; highlights?: unknown[] } => {
  const datarows = snapshot.datarows ?? [];
  const index = highlightIndex(snapshot.schema);
  if (index < 0) return { datarows };

  return {
    datarows: datarows.map((row) => row.filter((_, i) => i !== index)),
    highlights: datarows.map((row) => row[index]),
  };
};

interface SnapshotColumn {
  name: string;
  /** Mapped through `getFieldType`, so it matches the non-streaming `fieldSchema`. */
  type?: string;
}

/**
 * Column metadata for a snapshot, aligned with the rows `splitHighlightColumn` returns. Derived once
 * per snapshot rather than per row, since the schema is constant for the lifetime of a job.
 */
export const snapshotColumns = (snapshot: Pick<PPLStreamSnapshot, 'schema'>): SnapshotColumn[] =>
  (snapshot.schema ?? [])
    .filter((column) => column.name !== HIGHLIGHT_COLUMN)
    .map((column) => ({
      name: column.name,
      type: getFieldType({ name: column.name, type: column.type }),
    }));

export const snapshotRowsToObjects = (
  snapshot: Pick<PPLStreamSnapshot, 'schema' | 'datarows'>,
  formatter?: FieldValueFormatter
): Array<Record<string, unknown>> => {
  const columns = snapshotColumns(snapshot);
  const { datarows } = splitHighlightColumn(snapshot);
  return datarows.map((row) =>
    columns.reduce<Record<string, unknown>>((record, column, index) => {
      if (index < row.length) {
        const value = row[index];
        record[column.name] =
          formatter && column.type === 'date' ? formatter(value, OSD_FIELD_TYPES.DATE) : value;
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
   * Distinguishes one generation of rows from the next, so synthesised `_id`s stay stable while rows
   * append but change when a REPLACE snapshot supersedes them.
   */
  rowGeneration?: number;
  /** Per-row search highlights, positionally aligned with `rows`. */
  highlights?: unknown[];
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
  rowGeneration = 0,
  highlights,
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
      // PPL hits carry no document id, and the table falls back to the row's position as its React
      // key. While rows append that is stable, but a REPLACE snapshot puts a different document at
      // the same position, so React would reuse the previous row's state — an expanded row would
      // stay open over unrelated content. The generation makes the id change when that happens.
      hits: rows.map((source, index) => ({
        _id: `${rowGeneration}:${index}`,
        _index: indexName,
        _source: source,
        ...(highlights?.[index] ? { highlight: highlights[index] } : {}),
      })),
    },
    elapsedMs,
    fieldSchema: snapshotColumns(snapshot),
    // Same mapping the synchronous strategy applies: 'sql-complex-worker' is what marks a complex
    // query, which the save dialog warns about.
    ...(snapshot.profile?.thread_pool && {
      profile: {
        queryPool: snapshot.profile.thread_pool,
        isComplex: snapshot.profile.thread_pool === 'sql-complex-worker',
      },
    }),
    ...(snapshot.warnings?.length ? { warnings: snapshot.warnings } : {}),
  } as ISearchResult;

  if (histogram) {
    result.aggregations = {
      [histogram.aggId]: { buckets: histogram.buckets },
    };
  }

  return result;
};
