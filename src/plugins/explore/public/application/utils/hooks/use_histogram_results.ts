/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { RootState } from '../state_management/store';
import { prepareHistogramCacheKey } from '../state_management/actions/query_actions';
import { resultsCache } from '../state_management/slices';

/**
 * Hook for reading histogram result from result slice
 */
export const useHistogramResults = () => {
  const query = useSelector((state: RootState) => state.query);

  const cacheKey = useMemo(() => {
    return prepareHistogramCacheKey(query);
  }, [query]);

  const metadata = useSelector((state: RootState) => (cacheKey ? state.results[cacheKey] : null));

  return {
    results: metadata ? resultsCache.get(cacheKey) ?? null : null,
  };
};
