/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './discover_chart_container.scss';
import React, { useMemo } from 'react';
import { DiscoverViewServices } from '../../../build_services';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { useDiscoverContext } from '../context';
import { SearchData } from '../utils/use_search';
import { DiscoverChart } from '../../components/chart/chart';
import { QUERY_ENHANCEMENT_ENABLED_SETTING } from '../../../../common';

export const DiscoverChartContainer = ({ hits, bucketInterval, chartData }: SearchData) => {
  const { services } = useOpenSearchDashboards<DiscoverViewServices>();
  const { uiSettings, data } = services;
  const { indexPattern } = useDiscoverContext();
  const isEnhancementsEnabled = uiSettings.get(QUERY_ENHANCEMENT_ENABLED_SETTING);

  const isTimeBased = useMemo(() => (indexPattern ? indexPattern.isTimeBased() : false), [
    indexPattern,
  ]);

  if (!hits || !isTimeBased) return null;

  return (
    <DiscoverChart
      bucketInterval={bucketInterval}
      chartData={chartData}
      config={uiSettings}
      data={data}
      services={services}
      isEnhancementsEnabled={isEnhancementsEnabled}
    />
  );
};
