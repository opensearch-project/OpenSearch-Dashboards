/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { RootState } from '../state_management/store';
import { prepareBucketCountCacheKey } from '../state_management/actions/query_actions';
import { resultsCache } from '../state_management/slices';

/**
 * Hook for reading bucket count result from result slice.
 * Returns the total number of aggregation buckets for PPL stats queries.
 */
export const useBucketCountResults = () => {
  const query = useSelector((state: RootState) => state.query);

  const cacheKey = useMemo(() => {
    return prepareBucketCountCacheKey(query);
  }, [query]);

  const metadata = useSelector((state: RootState) => (cacheKey ? state.results[cacheKey] : null));
  const results = metadata ? (resultsCache.get(cacheKey) ?? null) : null;

  // The bucket count query appends `| stats count() as bucket_count` which produces a single
  // row with a guaranteed field name. Fall back to common aliases in case of older backends.
  const bucketCount = useMemo(() => {
    if (!results?.hits?.hits?.length) return undefined;
    const firstHit = results.hits.hits[0];
    if (!firstHit?._source) return undefined;
    const source = firstHit._source as Record<string, unknown>;
    const count = source.bucket_count ?? source['count()'] ?? source.count;
    return typeof count === 'number' ? count : undefined;
  }, [results]);

  return { bucketCount };
};
