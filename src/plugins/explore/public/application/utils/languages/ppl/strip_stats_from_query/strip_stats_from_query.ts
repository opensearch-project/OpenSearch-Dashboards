/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Query } from '../../../../../../../data/common';
import { QueryWithQueryAsString } from '../../types';

/**
 * Removes stats pipe for histogram compatibility
 * Returns only the prepared query whose query field can be used for cache key usage
 */
export const stripStatsFromQuery = (query: Query): QueryWithQueryAsString => {
  const queryString = typeof query.query === 'string' ? query.query : '';

  // Remove stats pipe (and everything after it) for histogram compatibility.
  // [\s\S]* is used instead of .* so the match crosses newline boundaries in
  // multi-line queries (e.g. "| stats count by host\n| sort -count").
  const strippedQueryString = queryString.replace(/\s*\|\s*stats[\s\S]*$/i, '');

  return {
    ...query,
    query: strippedQueryString,
  };
};
