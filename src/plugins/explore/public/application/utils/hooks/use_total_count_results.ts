/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { RootState } from '../state_management/store';
import { prepareTotalCountCacheKey } from '../state_management/actions/query_actions';

/**
 * Hook for reading total count result from result slice.
 * The total count query is a head-stripped histogram query that provides the true total
 * hit count across all matching documents, regardless of head/fetch_size limits.
 */
export const useTotalCountResults = () => {
  const query = useSelector((state: RootState) => state.query);
  const results = useSelector((state: RootState) => state.results);

  const cacheKey = useMemo(() => {
    return prepareTotalCountCacheKey(query);
  }, [query]);

  return {
    results: cacheKey ? results[cacheKey] : null,
  };
};
