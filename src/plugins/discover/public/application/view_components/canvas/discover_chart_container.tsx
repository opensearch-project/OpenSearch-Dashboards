/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './discover_chart_container.scss';
import React from 'react';
import { DiscoverViewServices } from '../../../build_services';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { useDiscoverContext } from '../context';
import { SearchData } from '../utils/use_search';
import { DiscoverChart } from '../../components/chart/chart';

export const DiscoverChartContainer = ({ hits, bucketInterval, chartData }: SearchData) => {
  const { services } = useOpenSearchDashboards<DiscoverViewServices>();
  const { uiSettings, data } = services;
  const { indexPattern } = useDiscoverContext();

  const timeField = indexPattern?.timeFieldName ? indexPattern.timeFieldName : undefined;

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
