/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpSetup } from '../../../../../../../../core/public';
import { PPLPatternsMode, Query } from '../../../../../../../data/common';
import { patternsModeCache } from '../../../../../../../data/public';
import { maskPPLSubqueriesAndStrings } from '../mask_ppl_subqueries_and_strings';

/**
 * The PPL command traits live in the data plugin so that explore (tab routing, the Logs/histogram
 * strip, the bucket count, partial-result streaming) and query_enhancements (the default sort) all
 * read the same table. Re-exported here so explore code has one local import.
 */
export {
  PPLCommandTraits,
  PPLPatternsMode,
  PPLTraitOptions,
  PPL_COMMAND_TRAITS,
  PPL_PATTERNS_AGGREGATION_TRAITS,
  PPL_PATTERNS_AGGREGATION_MODE_REGEX,
  getPPLCommandsWhere,
  getPPLPatternsAggregationRegex,
  buildPPLCommandRegex,
  maskedPPLQueryHasTrait,
} from '../../../../../../../data/common';

/**
 * The cluster's default `patterns` mode for the query's data source, if it has been fetched (see
 * {@link ensurePatternsDefaultMode}). Undefined means unknown.
 */
export const getPatternsDefaultMode = (
  query: Pick<Query, 'dataset'>
): PPLPatternsMode | undefined => patternsModeCache.getCached(query.dataset?.dataSource?.id);

/**
 * Whether {@link ensurePatternsDefaultMode} has to fetch for this query, i.e. it has a `patterns`
 * without `mode=` and the data source's default mode isn't known yet.
 */
export const patternsDefaultModeNeedsFetch = (
  query: Pick<Query, 'query' | 'dataset' | 'language'>
): boolean =>
  query.language === 'PPL' &&
  typeof query.query === 'string' &&
  patternsModeCache.needsFetch(
    maskPPLSubqueriesAndStrings(query.query),
    query.dataset?.dataSource?.id
  );

/**
 * Fetches the cluster's default `patterns` mode when the query has a `patterns` command without an
 * explicit `mode=` and it isn't cached yet; otherwise resolves immediately. Await it before analyzing
 * the query (tab routing, cache keys, bucket count), so every analysis of the same query agrees.
 */
export const ensurePatternsDefaultMode = (
  http: HttpSetup | undefined,
  query: Pick<Query, 'query' | 'dataset' | 'language'>
): Promise<PPLPatternsMode | undefined> => {
  if (!http || query.language !== 'PPL' || typeof query.query !== 'string') {
    return Promise.resolve(getPatternsDefaultMode(query));
  }
  return patternsModeCache.ensure(
    http,
    maskPPLSubqueriesAndStrings(query.query),
    query.dataset?.dataSource?.id
  );
};
