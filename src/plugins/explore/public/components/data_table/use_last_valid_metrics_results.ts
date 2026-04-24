/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../application/utils/state_management/store';
import { defaultPrepareQueryString } from '../../application/utils/state_management/actions/query_actions';
import {
  IPrometheusSearchResult,
  resultsCache,
} from '../../application/utils/state_management/slices';

/**
 * When the query is edited but not yet executed, the new cacheKey won't have results.
 * This hook keeps showing results from the last executed query until a new execution occurs.
 */
export function useLastValidPrometheusResult(): IPrometheusSearchResult | null {
  const query = useSelector((state: RootState) => state.query);
  const cacheKey = useMemo(() => defaultPrepareQueryString(query), [query]);
  const lastValidKeyRef = useRef(cacheKey);

  const hasCurrentResults = useSelector((state: RootState) => !!state.results[cacheKey]);

  useEffect(() => {
    if (hasCurrentResults) {
      lastValidKeyRef.current = cacheKey;
    }
  }, [hasCurrentResults, cacheKey]);

  const effectiveKey = hasCurrentResults ? cacheKey : lastValidKeyRef.current;

  const hasMetadata = useSelector((state: RootState) => !!state.results[effectiveKey]);
  return hasMetadata ? (resultsCache.get(effectiveKey) as IPrometheusSearchResult) ?? null : null;
}
