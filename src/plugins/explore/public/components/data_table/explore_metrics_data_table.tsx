/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { MetricsDataTable } from './metrics_data_table';
import { RootState } from '../../application/utils/state_management/store';
import { defaultPrepareQueryString } from '../../application/utils/state_management/actions/query_actions';
import { IPrometheusSearchResult } from '../../application/utils/state_management/slices';

/**
 * Wrapper component that connects MetricsDataTable to Redux state
 */
export const ExploreMetricsDataTable: React.FC = () => {
  const query = useSelector((state: RootState) => state.query);
  const cacheKey = useMemo(() => defaultPrepareQueryString(query), [query]);
  const results = useSelector((state: RootState) => state.results);
  const searchResult = results[cacheKey] as IPrometheusSearchResult;
  return <MetricsDataTable searchResult={searchResult} />;
};
