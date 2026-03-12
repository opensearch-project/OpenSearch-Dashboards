/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { MetricsRawTable } from './metrics_raw_table';
import { RootState } from '../../application/utils/state_management/store';
import { defaultPrepareQueryString } from '../../application/utils/state_management/actions/query_actions';
import {
  IPrometheusSearchResult,
  resultsCache,
} from '../../application/utils/state_management/slices';

/**
 * Wrapper component that connects MetricsRawTable to Redux state
 */
export const ExploreMetricsRawTable: React.FC = () => {
  const query = useSelector((state: RootState) => state.query);
  const cacheKey = useMemo(() => defaultPrepareQueryString(query), [query]);
  const metadata = useSelector((state: RootState) => state.results[cacheKey]);
  const searchResult = metadata
    ? (resultsCache.get(cacheKey) as IPrometheusSearchResult) ?? null
    : null;
  return <MetricsRawTable searchResult={searchResult} />;
};
