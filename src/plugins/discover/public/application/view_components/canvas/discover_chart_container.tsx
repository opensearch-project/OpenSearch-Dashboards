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

export const DiscoverChartContainer = ({ hits, bucketInterval, chartData }: SearchData) => {
  const { services } = useOpenSearchDashboards<DiscoverViewServices>();
  const { uiSettings, data, core } = services;
  const { indexPattern, savedSearch } = useDiscoverContext();

  const isTimeBased = useMemo(() => (indexPattern ? indexPattern.isTimeBased() : false), [
    indexPattern,
  ]);

  if (!hits) return null;

  return (
    <DiscoverChart
      bucketInterval={bucketInterval}
      chartData={chartData}
      config={uiSettings}
      data={data}
      hits={hits}
      resetQuery={() => {
        core.application.navigateToApp('discover', { path: `#/view/${savedSearch?.id}` });
      }}
      services={services}
      showResetButton={!!savedSearch && !!savedSearch.id}
      isTimeBased={isTimeBased}
    />
  );
};
