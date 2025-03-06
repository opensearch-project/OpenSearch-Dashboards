/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFlexItem, EuiPanel } from '@elastic/eui';
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { DiscoverViewServices } from '../../../build_services';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { DataGridTable } from '../../components/data_grid/data_grid_table';
import { useDiscoverContext } from '../context';

import { SearchData } from '../utils';
import { IExpressionLoaderParams } from '../../../../../expressions/public';
import { useVisualizationType } from '../utils/use_visualization_type';

export const DiscoverVisualization = ({ hits, bucketInterval, chartData, rows }: SearchData) => {
  const { services } = useOpenSearchDashboards<DiscoverViewServices>();
  const {
    data: {
      query: { filterManager, queryString, timefilter },
    },
    expressions: { ReactExpressionRenderer },
  } = services;

  console.log('DiscoverVisualization rows:', rows);

  // Get configs and expression utils from a specific visualization type
  const { toExpression, ui } = useVisualizationType();
  //   const { aggConfigs, indexPattern } = useAggs();
  const [expression, setExpression] = useState<string>();
  const [searchContext, setSearchContext] = useState<IExpressionLoaderParams['searchContext']>({
    query: queryString.getQuery(),
    filters: filterManager.getFilters(),
    timeRange: timefilter.timefilter.getTime(),
  });

  useEffect(() => {
    async function loadExpression() {
      const exp = await toExpression(searchContext);
      setExpression(exp);
    }

    loadExpression();
  }, [toExpression, searchContext]);

  useLayoutEffect(() => {
    const subscription = services.data.query.state$.subscribe(({ state }) => {
      setSearchContext({
        query: state.query,
        timeRange: state.time,
        filters: state.filters,
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [services.data.query.state$]);

  return (
    <EuiPanel className="vbCanvas" data-test-subj="visualizationLoader">
      {expression ? (
        <ReactExpressionRenderer expression={expression} searchContext={searchContext} />
      ) : (
        <EuiFlexItem
          className="discoverVisualization__empty"
          data-test-subj="emptyDiscoverVisualization"
        >
          {}
        </EuiFlexItem>
      )}
    </EuiPanel>
  );
};
