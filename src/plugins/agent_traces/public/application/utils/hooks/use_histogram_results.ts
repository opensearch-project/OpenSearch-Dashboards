/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { RootState } from '../state_management/store';
import { prepareHistogramCacheKey } from '../state_management/actions/query_actions';

/**
 * Hook for reading histogram result from result slice
 */
export const useHistogramResults = () => {
  const query = useSelector((state: RootState) => state.query);
  const results = useSelector((state: RootState) => state.results);

  const cacheKey = useMemo(() => {
    return prepareHistogramCacheKey(query);
  }, [query]);

  return {
    results: cacheKey ? results[cacheKey] : null,
  };
};
