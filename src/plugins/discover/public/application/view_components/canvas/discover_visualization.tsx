/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './discover_visualization.scss';

import { EuiFlexGroup, EuiFlexItem, EuiPanel } from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import { DiscoverViewServices } from '../../../build_services';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { useDiscoverContext } from '../context';

import { SearchData } from '../utils';
import { IExpressionLoaderParams } from '../../../../../expressions/public';
import { useVisualizationType } from '../utils/use_visualization_types';
import { LineChartStyleControls } from '../../components/visualizations/line/line_vis_type';

export const DiscoverVisualization = ({
  hits,
  bucketInterval,
  chartData,
  rows,
  fieldSchema,
}: SearchData) => {
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
  const visOptions = useVisualizationType().ui.style.render;
  const defaultStyles = useVisualizationType().ui.style.defaults;
  const [expression, setExpression] = useState<string>();
  const [styleOptions, setStyleOptions] = useState<LineChartStyleControls>(defaultStyles);
  const [searchContext, setSearchContext] = useState<IExpressionLoaderParams['searchContext']>({
    query: queryString.getQuery(),
    filters: filterManager.getFilters(),
    timeRange: timefilter.timefilter.getTime(),
  });
  const [enableViz, setEnableViz] = useState(
    queryString.getLanguageService().getLanguage(queryString.getQuery()!.language)!
      .showVisualization
  );

  useEffect(() => {
    async function loadExpression() {
      if (!rows || !indexPattern) {
        return;
      }
      const exp = await toExpression(
        services,
        searchContext,
        rows,
        indexPattern,
        fieldSchema,
        styleOptions
      );
      setExpression(exp);
    }

    loadExpression();
  }, [toExpression, searchContext, rows, indexPattern, services, fieldSchema, styleOptions]);

  useEffect(() => {
    const subscription = services.data.query.state$.subscribe(({ state }) => {
      setSearchContext({
        query: state.query,
        timeRange: state.time,
        filters: state.filters,
      });

      setEnableViz(
        queryString.getLanguageService().getLanguage(state.query!.language)!.showVisualization ??
          false
      );
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryString, services.data.query.state$]);

  return enableViz && expression ? (
    <EuiFlexGroup gutterSize="none">
      <EuiFlexItem grow={3}>
        <EuiPanel className="discoverVisualization" data-test-subj="visualizationLoader">
          <ReactExpressionRenderer
            key={JSON.stringify(searchContext) + expression}
            expression={expression}
            searchContext={searchContext}
          />
        </EuiPanel>
      </EuiFlexItem>
      <EuiFlexItem grow={1}>
        <EuiPanel className="stylePanel" data-test-subj="stylePanel">
          {visOptions({ defaultStyles, onChange: setStyleOptions })}
        </EuiPanel>
      </EuiFlexItem>
    </EuiFlexGroup>
  ) : (
    <></>
  );
};
