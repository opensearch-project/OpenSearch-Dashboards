/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// No imports: Explore's histogram parser reads these too, without the registry's dependencies.

/**
 * The column names a `buildHistogramQuery` query returns, in any order. A breakdown histogram also
 * returns the breakdown field. Declare the aliases your query uses with this type, so a change here
 * fails your type check.
 *
 * - `time`: the bucket start, as epoch milliseconds (a number or a digit-only string), an ISO 8601
 *   timestamp with `Z` or a numeric offset (`2026-09-25T06:11:00Z`, `…+02:00`), or
 *   `YYYY-MM-DD HH:mm:ss[.SSS]` with no zone, read as UTC. Zone names (`… UTC`) are not read.
 * - `count`: the bucket's count, as a number or a numeric string.
 */
export interface SourceTypeHistogramColumns {
  time: '@timestamp';
  count: 'count';
}

export const HISTOGRAM_RESULT_COLUMNS: Readonly<SourceTypeHistogramColumns> = Object.freeze({
  time: '@timestamp',
  count: 'count',
});
