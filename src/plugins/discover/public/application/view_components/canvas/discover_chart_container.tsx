/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './discover_chart_container.scss';
import React, { useState, useEffect } from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { DiscoverViewServices } from '../../../build_services';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { useDiscoverContext } from '../context';
import { useDispatch } from '../../utils/state_management';
import { SearchData } from '../utils/use_search';
import { DiscoverChart } from '../../components/chart/chart';

export const DiscoverChartContainer = () => {
  const { services } = useOpenSearchDashboards<DiscoverViewServices>();
  const { uiSettings, data } = services;
  const { data$, indexPattern } = useDiscoverContext();
  const [fetchState, setFetchState] = useState<SearchData>({
    status: data$.getValue().status,
    hits: 0,
    bucketInterval: {},
    chartData: {},
  });

  const dispatch = useDispatch();

  const { hits, bucketInterval, chartData } = fetchState || {};

  useEffect(() => {
    const subscription = data$.subscribe((next) => {
      if (
        next.status !== fetchState.status ||
        (next.hits && next.hits !== fetchState.hits) ||
        (next.bucketInterval && next.bucketInterval !== fetchState.bucketInterval) ||
        (next.chartData && next.chartData !== fetchState.chartData)
      ) {
        setFetchState({ ...fetchState, ...next });
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [data$, fetchState]);

  if (indexPattern === undefined) {
    // TODO: handle better
    return null;
  }

  const timeField = indexPattern.timeFieldName ? indexPattern.timeFieldName : undefined;

  if (!hits || !bucketInterval || !chartData) {
    // TODO: handle better
    return null;
  }

  return (
    <DiscoverChart
      bucketInterval={bucketInterval}
      chartData={chartData}
      config={uiSettings}
      data={data}
      hits={hits}
      timeField={timeField}
      resetQuery={() => {}}
      services={services}
    />
  );
};
