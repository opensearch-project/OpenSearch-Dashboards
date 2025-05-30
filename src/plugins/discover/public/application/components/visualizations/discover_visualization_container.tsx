/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { DiscoverViewServices } from '../../../build_services';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { useDiscoverContext } from '../../view_components/context';

import { SearchData } from '../../view_components/utils';
import { IExpressionLoaderParams } from '../../../../../expressions/public';
import {
  getVisualizationType,
  VisualizationTypeResult,
} from '../../view_components/utils/use_visualization_types';
import { LineChartStyleControls } from './line/line_vis_config';
import { visualizationRegistry } from './visualization_registry';
import { lineChartRule } from './line/line_chart_rules';
import { DiscoverVisualization } from './discover_visualization';

export const DiscoverVisualizationContainer = ({ rows, fieldSchema }: SearchData) => {
  const { services } = useOpenSearchDashboards<DiscoverViewServices>();
  const {
    data: {
      query: { filterManager, queryString, timefilter },
    },
    expressions: { ReactExpressionRenderer },
  } = services;
  const { indexPattern } = useDiscoverContext();

  // Register all rules
  visualizationRegistry.registerRule(lineChartRule);

  const [visualizationData, setVisualizationData] = useState<VisualizationTypeResult | undefined>(
    undefined
  );

  const [expression, setExpression] = useState<string>();
  const [styleOptions, setStyleOptions] = useState<LineChartStyleControls | undefined>(undefined);
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
    if (fieldSchema) {
      const result = getVisualizationType(rows, fieldSchema);
      if (result) {
        setVisualizationData({ ...result });

        // Todo: everytime the fields change, do we reset the style options?
        setStyleOptions(result.visualizationType?.ui.style.defaults);
      }
    }
  }, [fieldSchema, rows]);

  useEffect(() => {
    async function loadExpression() {
      if (!rows || !indexPattern || !visualizationData) {
        return;
      }
      const exp = await visualizationData.visualizationType?.toExpression(
        services,
        searchContext,
        indexPattern,
        visualizationData.transformedData,
        visualizationData.numericalColumns,
        visualizationData.categoricalColumns,
        visualizationData.dateColumns,
        styleOptions
      );
      setExpression(exp);
    }

    loadExpression();
  }, [searchContext, rows, indexPattern, services, styleOptions, visualizationData]);

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

  const handleStyleChange = (newOptions: Partial<LineChartStyleControls>) => {
    if (styleOptions) {
      setStyleOptions({ ...styleOptions, ...newOptions });
    }
  };

  // Don't render if visualization is not enabled or data is not ready
  if (!enableViz || !expression || !visualizationData || !styleOptions) {
    return null;
  }

  return (
    <DiscoverVisualization
      expression={expression}
      searchContext={searchContext}
      styleOptions={styleOptions}
      visualizationData={visualizationData}
      onStyleChange={handleStyleChange}
      ReactExpressionRenderer={ReactExpressionRenderer}
    />
  );
};
