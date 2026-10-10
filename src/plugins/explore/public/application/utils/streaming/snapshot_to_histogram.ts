/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PPLStreamSnapshot } from '../../../../../query_enhancements/common';
import { parseRowTimestamp } from './parse_row_timestamp';

/**
 * Converts a streamed histogram snapshot into chart buckets.
 *
 * `stats count() by span(<field>, <interval>)` returns one row per bucket:
 *
 *   schema:   [{ name: 'count()', type: 'bigint' }, { name: 'span(`@timestamp`,1h)', type: 'timestamp' }]
 *   datarows: [[58823, '2026-09-14 19:00:00'], [211765, '2026-09-14 20:00:00'], ...]
 *
 * These are authoritative counts over every matching document, computed by the engine — not an
 * approximation derived from the subset of rows a client happened to fetch. On the progressive
 * backend the aggregation publishes `REPLACE` snapshots as composite pages complete, so the counts
 * grow toward the true distribution while the query runs.
 */

export interface HistogramBucket {
  key: number;
  key_as_string: string;
  doc_count: number;
}

/** Identifies the bucket column by schema type, falling back to the non-numeric column. */
const findBucketColumnIndex = (schema: PPLStreamSnapshot['schema']): number => {
  const byType = schema.findIndex((column) => /timestamp|date/i.test(column.type ?? ''));
  if (byType >= 0) return byType;
  const bySpan = schema.findIndex((column) => /span\s*\(/i.test(column.name ?? ''));
  return bySpan >= 0 ? bySpan : schema.length - 1;
};

export const snapshotToHistogramBuckets = (snapshot: PPLStreamSnapshot): HistogramBucket[] => {
  const schema = snapshot.schema ?? [];
  const rows = snapshot.datarows ?? [];
  if (schema.length < 2 || rows.length === 0) return [];

  const bucketIdx = findBucketColumnIndex(schema);
  // With only a bucket and a metric column, the count is whichever one is not the bucket.
  const countIdx = bucketIdx === 0 ? 1 : 0;

  const buckets: HistogramBucket[] = [];
  for (const row of rows) {
    const key = parseRowTimestamp(row[bucketIdx]);
    if (key === undefined) continue;
    const count = Number(row[countIdx]);
    buckets.push({
      key,
      key_as_string: new Date(key).toISOString(),
      doc_count: Number.isFinite(count) ? count : 0,
    });
  }

  // The chart expects ascending buckets; composite pages do not guarantee ordering.
  return buckets.sort((a, b) => a.key - b.key);
};
