/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Query } from '../../../../../../../data/common';
import { QueryWithQueryAsString } from '../../types';
import { AGGREGATION_COMMAND_PATTERN } from '../aggregation_commands';
import { maskPPLSubqueriesAndStrings } from '../mask_ppl_subqueries_and_strings';

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

  // Mask quoted strings and bracketed subqueries first so a "| stats/top/rare" inside a string
  // literal or nested subquery isn't mistaken for the aggregation pipe. The mask preserves length,
  // so the match index maps back onto the original, which we slice. [\s\S]* (not .*) lets the match
  // cross newlines; \b avoids matching names that merely start with the command (e.g. a "topic"
  // field).
  const masked = maskPPLSubqueriesAndStrings(queryString);
  const match = masked.match(
    new RegExp(`\\s*\\|\\s*(${AGGREGATION_COMMAND_PATTERN})\\b[\\s\\S]*$`, 'i')
  );
  const strippedQueryString =
    match && match.index !== undefined ? queryString.slice(0, match.index) : queryString;

  return {
    ...query,
    query: strippedQueryString,
  };
};
