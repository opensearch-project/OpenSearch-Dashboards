/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// No imports: Explore's histogram parser reads these too, without the registry's dependencies.

/**
 * The column names a `buildHistogramQuery` query returns, in any order: the bucket start (a
 * timestamp string, read as UTC when it has no zone, or epoch milliseconds) and the bucket's count
 * (a number or a numeric string). A breakdown histogram also returns the breakdown field. Declare
 * the aliases your query uses with this type, so a change here fails your type check.
 */
export interface SourceTypeHistogramColumns {
  time: '@timestamp';
  count: 'count';
}

export const HISTOGRAM_RESULT_COLUMNS: Readonly<SourceTypeHistogramColumns> = Object.freeze({
  time: '@timestamp',
  count: 'count',
});
