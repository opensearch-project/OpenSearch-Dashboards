/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { DiscoverViewServices } from '../../application/legacy/discover/build_services';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { useDiscoverContext } from '../../application/legacy/discover/application/view_components/context';

import { SearchData } from '../../application/legacy/discover/application/view_components/utils';
import { IExpressionLoaderParams } from '../../../../expressions/public';
import { LineChartStyleControls } from './line/line_vis_config';
import { Visualization } from './visualization';
import {
  getVisualizationType,
  VisualizationTypeResult,
  useVisualizationRegistry,
} from './utils/use_visualization_types';

import './visualization_container.scss';
import { VisColumn } from './types';
import { toExpression } from './utils/to_expression';

export const VisualizationContainer = ({ rows, fieldSchema }: SearchData) => {
  const { services } = useOpenSearchDashboards<DiscoverViewServices>();
  const {
    data: {
      query: { filterManager, queryString, timefilter },
    },
    expressions: { ReactExpressionRenderer },
  } = services;
  const { indexPattern } = useDiscoverContext();

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

  // Hook to get the visualization type based on the rows and field schema
  // This will be called every time the rows or fieldSchema changes
  useEffect(() => {
    if (fieldSchema) {
      const result = getVisualizationType(rows, fieldSchema);
      if (result) {
        setVisualizationData({ ...result });

        // TODO: everytime the fields change, do we reset the chart type and its style options? P1: we will implement chart type selection persistence
        setStyleOptions(result.visualizationType?.ui.style.defaults);
      }
    }
  }, [fieldSchema, rows]);

  // Get the visualization registry
  const visualizationRegistry = useVisualizationRegistry();

  // Hook to generate the expression based on the visualization type and data
  useEffect(() => {
    async function loadExpression() {
      if (!rows || !indexPattern || !visualizationData || !visualizationData.ruleId) {
        return;
      }

      // Get the selected chart type
      const selectedChartType = visualizationData.visualizationType?.type || 'line';

      // Get the selected rule id
      const rule = visualizationRegistry.getRules().find((r) => r.id === visualizationData.ruleId);

      if (!rule || !rule.toExpression) {
        return;
      }

      // Create a function that call the specific rule's toExpression method
      const ruleBasedToExpressionFn = (
        transformedData: Array<Record<string, any>>,
        numericalColumns: VisColumn[],
        categoricalColumns: VisColumn[],
        dateColumns: VisColumn[],
        styleOpts: any
      ) => {
        return rule.toExpression!(
          transformedData,
          numericalColumns,
          categoricalColumns,
          dateColumns,
          styleOpts,
          selectedChartType
        );
      };

      // Create a complete expression using the toExpression function including the OpenSearch Dashboards context and the Vega spec
      const exp = await toExpression(
        searchContext,
        indexPattern,
        ruleBasedToExpressionFn,
        visualizationData.transformedData,
        visualizationData.numericalColumns,
        visualizationData.categoricalColumns,
        visualizationData.dateColumns,
        styleOptions
      );
      setExpression(exp);
    }

    loadExpression();
  }, [
    searchContext,
    rows,
    indexPattern,
    services,
    styleOptions,
    visualizationData,
    visualizationRegistry,
  ]);

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
  if (!expression || !visualizationData || !styleOptions) {
    return null;
  }

  return (
    <div className="exploreVisContainer">
      <Visualization
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
