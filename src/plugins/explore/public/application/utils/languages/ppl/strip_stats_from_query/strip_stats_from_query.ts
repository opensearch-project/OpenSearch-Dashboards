/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Query } from '../../../../../../../data/common';
import { QueryWithQueryAsString } from '../../types';
import {
  buildPPLCommandRegex,
  getPatternsDefaultMode,
  getPPLCommandsWhere,
  getPPLPatternsAggregationRegex,
} from '../aggregation_commands';
import { maskPPLSubqueriesAndStrings } from '../mask_ppl_subqueries_and_strings';

// Commands whose output can't take the histogram's `| stats count() by span(...)` (that append
// fails with "Field [timestamp] not found" once the raw time field is gone). Derived from the shared
// command traits so tab routing sends the same queries off the Logs tab.
const HISTOGRAM_INCOMPATIBLE_COMMAND_REGEX = buildPPLCommandRegex(
  getPPLCommandsWhere((traits) => traits.stripsFromHistogram),
  { toEnd: true }
);

/**
 * Removes the first aggregating pipe (and everything after it) for histogram compatibility.
 *
 * The commands matched here (see PPL_COMMAND_TRAITS) all produce aggregated/pivoted output rather than document rows, so they
 * belong on the Statistics tab rather than the Logs/histogram views. Stripping them yields a
 * document-fetch query whose result the Logs tab and histogram can render, and gives that query a
 * distinct cache key from the full aggregation query. Kept named `stripStatsFromQuery` for its
 * callers.
 *
 * `patterns` is only stripped when it aggregates: with an explicit `mode=aggregation`, or with no
 * `mode=` on a cluster whose default mode is aggregation (see ensurePatternsDefaultMode). Label-mode
 * `patterns` is left intact so the Logs tab keeps the pattern field it appends.
 *
 * Returns only the prepared query whose query field can be used for cache key usage.
 */
export const stripStatsFromQuery = (query: Query): QueryWithQueryAsString => {
  const queryString = typeof query.query === 'string' ? query.query : '';

  // Mask quoted strings and bracketed subqueries first so an aggregating command inside a string
  // literal or nested subquery isn't mistaken for the aggregation pipe. The mask preserves length,
  // so a match index maps back onto the original, which we slice. [\s\S]* (not .*) lets the match
  // cross newlines; \b avoids matching names that merely start with the command (e.g. a "topic"
  // field).
  const masked = maskPPLSubqueriesAndStrings(queryString);

  // Cut at the earliest match across the always-incompatible commands and aggregation-mode
  // patterns; everything from there on belongs on the Statistics tab, not the document-fetch query.
  const cutIndices = [
    masked.match(HISTOGRAM_INCOMPATIBLE_COMMAND_REGEX)?.index,
    masked.match(getPPLPatternsAggregationRegex(getPatternsDefaultMode(query)))?.index,
  ].filter((index): index is number => index !== undefined);

  const cutIndex = cutIndices.length > 0 ? Math.min(...cutIndices) : undefined;
  const strippedQueryString = cutIndex !== undefined ? queryString.slice(0, cutIndex) : queryString;

  return {
    ...query,
    query: strippedQueryString,
  };
};
