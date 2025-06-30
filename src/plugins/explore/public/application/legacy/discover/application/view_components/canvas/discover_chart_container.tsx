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
import {
  histogramResultsProcessor,
  defaultPrepareQuery,
} from '../../../../../utils/state_management/actions/query_actions';
import { RootState } from '../../../../../utils/state_management/store';

export const DiscoverChartContainer = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { uiSettings, data } = services;

  const { interval } = useSelector((state: RootState) => state.legacy);
  const query = useSelector((state: RootState) => state.query);
  const results = useSelector((state: RootState) => state.results);

  // Use default cache key computation for histogram data
  const cacheKey = useMemo(() => {
    const queryString = typeof query.query === 'string' ? query.query : '';
    return defaultPrepareQuery(queryString);
  }, [query]);

  const rawResults = cacheKey ? results[cacheKey] : null;

  // Get IndexPattern from centralized context
  const { indexPattern } = useIndexPatternContext();

  const isTimeBased = useMemo(() => {
    return indexPattern ? indexPattern.isTimeBased() : false;
  }, [indexPattern]);

  // Process raw results to get chart data
  const processedResults = useMemo(() => {
    if (!rawResults || !indexPattern) {
      return null;
    }

    // Use defaultResultsProcessor with histogram enabled
    const processed = histogramResultsProcessor(rawResults, indexPattern, data, interval);
    return processed;
  }, [rawResults, indexPattern, data, interval]);

  if (!isTimeBased) {
    return null;
  }

  // Return null if no processed results or no chart data
  if (!processedResults || !processedResults.chartData || !processedResults.hits.total) {
    return null;
  }

  return (
    <DiscoverChart
      bucketInterval={processedResults.bucketInterval}
      chartData={processedResults.chartData}
      config={uiSettings}
      data={data}
      services={services}
      isEnhancementsEnabled={true}
    />
  );
};
