/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { cloneDeep } from 'lodash';
import { useLayoutEffect, useMemo, useState } from 'react';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { VisBuilderViewServices } from '../../../types';
import { useTypedDispatch } from '../state_management';
import { useVisBuilderContext } from '../../view_components/context';

/**
 * Returns common agg parameters from the store and app context
 * @returns { indexPattern, aggConfigs, aggs, timeRange }
 */
export const useAggs = () => {
  const { services } = useOpenSearchDashboards<VisBuilderViewServices>();
  const {
    data: {
      search: { aggs: aggService },
      query: {
        timefilter: { timefilter },
      },
    },
  } = services;
  const [timeRange, setTimeRange] = useState(timefilter.getTime());
  const { indexPattern, rootState } = useVisBuilderContext();
  const aggConfigParams = rootState.visualization.activeVisualization?.aggConfigParams;
  const dispatch = useTypedDispatch();

  const aggConfigs = useMemo(() => {
    const configs =
      indexPattern && aggService.createAggConfigs(indexPattern, cloneDeep(aggConfigParams));
    return configs;
  }, [aggConfigParams, aggService, indexPattern]);

  useLayoutEffect(() => {
    const subscription = timefilter.getTimeUpdate$().subscribe(() => {
      setTimeRange(timefilter.getTime());
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [dispatch, timefilter]);

  return {
    aggConfigs,
    aggs: aggConfigs?.aggs ?? [],
    timeRange,
  };
};
