/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Query } from '../../../../../../../data/common';
import { QueryWithQueryAsString } from '../../types';

/**
 * Removes the first aggregation pipe (and everything after it) for histogram compatibility.
 *
 * `stats`, `top`, and `rare` all produce aggregated (bucketed) output rather than document rows, so
 * they cannot be combined with the histogram's own `| stats count() by span(...)` and belong on the
 * Statistics tab rather than the Logs/histogram views. Stripping them here yields a document-fetch
 * query whose result the Logs tab and histogram can render, and gives that query a distinct cache
 * key from the full aggregation query. Kept named `stripStatsFromQuery` for its callers.
 *
 * Returns only the prepared query whose query field can be used for cache key usage.
 */
export const stripStatsFromQuery = (query: Query): QueryWithQueryAsString => {
  const queryString = typeof query.query === 'string' ? query.query : '';

  // Remove the aggregation pipe (and everything after it). [\s\S]* is used instead of .* so the
  // match crosses newline boundaries in multi-line queries (e.g. "| stats count by host\n| sort
  // -count"). \b after the command name avoids matching field/command names that merely start with
  // it (e.g. a "topic" field).
  const strippedQueryString = queryString.replace(/\s*\|\s*(stats|top|rare)\b[\s\S]*$/i, '');

  return {
    ...query,
    query: strippedQueryString,
  };
};
