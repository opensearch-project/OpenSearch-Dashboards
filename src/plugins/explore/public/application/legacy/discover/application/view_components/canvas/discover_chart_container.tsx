/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './discover_chart_container.scss';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { ExploreServices } from '../../../../../../types';
import { useOpenSearchDashboards } from '../../../../../../../../opensearch_dashboards_react/public';
import { DiscoverChart } from '../../components/chart/chart';
import { useIndexPatternContext } from '../../../../../components/index_pattern_context';

export const DiscoverChartContainer = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { uiSettings, data } = services;

  const dataset = useSelector((state: any) => state.query?.dataset);
  const executionCacheKeys = useSelector((state: any) => state.ui?.executionCacheKeys || []);

  // Get the first cache key for histogram data (or could be made configurable)
  const cacheKey = executionCacheKeys.length > 0 ? executionCacheKeys[0] : '';
  const results = useSelector((state: any) => (cacheKey ? state.results[cacheKey] : null));

  // Get IndexPattern from centralized context
  const {
    indexPattern,
    isLoading: indexPatternLoading,
    error: indexPatternError,
  } = useIndexPatternContext();

  const isTimeBased = useMemo(() => {
    return indexPattern ? indexPattern.isTimeBased() : false;
  }, [indexPattern]);

  if (!isTimeBased) {
    return null;
  }

  // Return null if no results or no meaningful data
  if (!results || (!results.chartData && !results.hits?.hits?.length)) {
    return null;
  }

  return (
    <DiscoverChart
      bucketInterval={results.bucketInterval}
      chartData={results.chartData}
      config={uiSettings}
      data={data}
      services={services}
      isEnhancementsEnabled={true}
    />
  );
};
