/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { DiscoverViewServices } from '../../../build_services';
import { useOpenSearchDashboards } from '../../../../../../../../opensearch_dashboards_react/public';
import { useDiscoverContext } from '../../view_components/context';

import { SearchData } from '../../view_components/utils';
import { IExpressionLoaderParams } from '../../../../../../../../expressions/public';
import { LineChartStyleControls } from './line/line_vis_config';
import { visualizationRegistry } from './visualization_registry';
import { lineChartRule } from './line/line_chart_rules';
import { ExploreVisualization } from './explore_visualization';
import { getVisualizationType, VisualizationTypeResult } from './utils/use_visualization_types';

import './explore_visualization_container.scss';

export const ExploreVisualizationContainer = ({ rows, fieldSchema }: SearchData) => {
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

  // Hook to get the visualization type based on the rows and field schema
  // This will be called every time the rows or fieldSchema changes
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

  // Hook to generate the expression based on the visualization type and data
  useEffect(() => {
    async function loadExpression() {
      if (!rows || !indexPattern || !visualizationData) {
        return;
      }
      const exp = await visualizationData.visualizationType?.toExpression(
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

  // Hook to update the search context whenever the query state changes
  // This will ensure that the visualization is always up-to-date with the latest query and filters
  // Also updates the enableViz state based on the query language
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
    <div className="exploreVisualizationContainer">
      <ExploreVisualization
        data-subject-subj="exploreVisualization"
        expression={expression}
        searchContext={searchContext}
        styleOptions={styleOptions}
        visualizationData={visualizationData}
        onStyleChange={handleStyleChange}
        ReactExpressionRenderer={ReactExpressionRenderer}
      />
    </div>
  );
};
