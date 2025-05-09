/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './discover_visualization.scss';

import { EuiFlexItem, EuiPanel } from '@elastic/eui';
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { DiscoverViewServices } from '../../../build_services';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { useDiscoverContext } from '../context';

import { SearchData } from '../utils';
import { IExpressionLoaderParams } from '../../../../../expressions/public';
import { useVisualizationType } from '../utils/use_visualization_types';

export const DiscoverVisualization = ({ hits, bucketInterval, chartData, rows }: SearchData) => {
  const { services } = useOpenSearchDashboards<DiscoverViewServices>();
  const {
    data: {
      query: { filterManager, queryString, timefilter },
    },
    expressions: { ReactExpressionRenderer },
  } = services;
  const { indexPattern } = useDiscoverContext();

  // Get configs and expression utils from a specific visualization type
  const { toExpression } = useVisualizationType();
  //   const { aggConfigs, indexPattern } = useAggs();
  const [expression, setExpression] = useState<string>();
  const [searchContext, setSearchContext] = useState<IExpressionLoaderParams['searchContext']>({
    query: queryString.getQuery(),
    filters: filterManager.getFilters(),
    timeRange: timefilter.timefilter.getTime(),
  });

  useEffect(() => {
    async function loadExpression() {
      if (!rows || !indexPattern) {
        return;
      }
      const exp = await toExpression(services, searchContext, rows, indexPattern);
      console.log('expression for vis in discover', exp);
      setExpression(exp);
    }

    loadExpression();
  }, [toExpression, searchContext, rows, indexPattern, services]);

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
    <EuiPanel className="discoverVisualization" data-test-subj="visualizationLoader">
      {expression ? (
        <ReactExpressionRenderer
          key={JSON.stringify(searchContext) + expression}
          expression={expression}
          searchContext={searchContext}
        />
      ) : (
        <EuiFlexItem
          className="discoverVisualization__empty"
          data-test-subj="emptyDiscoverVisualization"
        >
          <>No data to display</>
        </EuiFlexItem>
      )}
    </EuiPanel>
  );
};
