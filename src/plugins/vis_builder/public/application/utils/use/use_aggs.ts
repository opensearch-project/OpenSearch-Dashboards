/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { cloneDeep } from 'lodash';
import { useLayoutEffect, useMemo, useState } from 'react';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { VisBuilderServices } from '../../../types';
import { useTypedSelector, useTypedDispatch } from '../state_management';
import { useIndexPatterns } from './use_index_pattern';

/**
 * Returns common agg parameters from the store and app context
 * @returns { indexPattern, aggConfigs, aggs, timeRange }
 */
export const useAggs = () => {
  const {
    services: {
      data: {
        search: { aggs: aggService },
        query: {
          timefilter: { timefilter },
        },
      },
    },
  } = useOpenSearchDashboards<VisBuilderServices>();
  const indexPattern = useIndexPatterns().selected;
  const [timeRange, setTimeRange] = useState(timefilter.getTime());
  const aggConfigParams = useTypedSelector(
    (state) => state.visualization.activeVisualization?.aggConfigParams
  );
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
    indexPattern,
    aggConfigs,
    aggs: aggConfigs?.aggs ?? [],
    timeRange,
  };
};
