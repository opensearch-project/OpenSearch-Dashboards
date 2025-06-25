/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import './visualization_container.scss';

import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { IExpressionLoaderParams } from '../../../../expressions/public';

import { Visualization } from './visualization';
import {
  getVisualizationType,
  useVisualizationRegistry,
  ChartType,
  ChartStyleControlMap,
  VisualizationTypeResult,
} from './utils/use_visualization_types';

import './visualization_container.scss';
import { VisColumn, VisualizationRule } from './types';
import { toExpression } from './utils/to_expression';
import { useIndexPatternContext } from '../../application/components/index_pattern_context';
import { ExploreServices } from '../../types';
import { RootState } from '../../application/utils/state_management/store';
import { selectRows } from '../../application/utils/state_management/selectors';

export const VisualizationContainer = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const {
    data: {
      query: { filterManager, queryString, timefilter },
    },
    expressions: { ReactExpressionRenderer },
  } = services;
  const { indexPattern } = useIndexPatternContext();

  const rows = useSelector(selectRows);
  const fieldSchema = useSelector((state: RootState) => {
    const executionCacheKeys = state.ui?.executionCacheKeys || [];
    if (executionCacheKeys.length === 0) {
      return [];
    }

    // Use tab specific cacheKey
    const cacheKey = executionCacheKeys[1];
    const results = state.results[cacheKey];
    if (results && results.fieldSchema) {
      return results.fieldSchema;
    }

    return [];
  });

  const visualizationData = useMemo(() => {
    if (fieldSchema.length === 0 || rows.length === 0) {
      return null;
    }

    return getVisualizationType(rows, fieldSchema);
  }, [fieldSchema, rows]);

  const [styleOptions, setStyleOptions] = useState<ChartStyleControlMap[ChartType] | undefined>(
    undefined
  );
  const [selectedChartType, setSelectedChartType] = useState<string | undefined>(undefined);
  const [searchContext, setSearchContext] = useState<IExpressionLoaderParams['searchContext']>({
    query: queryString.getQuery(),
    filters: filterManager.getFilters(),
    timeRange: timefilter.timefilter.getTime(),
  });

  // Hook to get the visualization type based on the rows and field schema
  // This will be called every time the rows or fieldSchema changes
  useEffect(() => {
    if (visualizationData) {
      // TODO: everytime the fields change, do we reset the chart type and its style options? P1: we will implement chart type selection persistence
      setStyleOptions(visualizationData.visualizationType?.ui.style.defaults);
    }
  }, [visualizationData]);

  const visualizationRegistry = useVisualizationRegistry();

  // Initialize selectedChartType when visualizationData changes
  useEffect(() => {
    if (visualizationData && visualizationData.visualizationType) {
      setSelectedChartType(visualizationData.visualizationType.type);
    }
  }, [visualizationData]);

  // Hook to generate the expression based on the visualization type and data
  const expression = useMemo(() => {
    if (
      !rows ||
      !indexPattern ||
      !visualizationData ||
      !visualizationData.ruleId ||
      !styleOptions
    ) {
      return null;
    }

    const rule = visualizationRegistry.getRules().find((r) => r.id === visualizationData.ruleId);

    if (!rule || !rule.toExpression) {
      return null;
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
    return toExpression(
      searchContext,
      indexPattern,
      ruleBasedToExpressionFn,
      visualizationData.transformedData,
      visualizationData.numericalColumns,
      visualizationData.categoricalColumns,
      visualizationData.dateColumns,
      styleOptions
    );
  }, [
    searchContext,
    rows,
    indexPattern,
    styleOptions,
    visualizationData,
    visualizationRegistry,
    selectedChartType,
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

  const handleStyleChange = (newOptions: Partial<ChartStyleControlMap[ChartType]>) => {
    if (styleOptions) {
      setStyleOptions({ ...styleOptions, ...newOptions } as ChartStyleControlMap[ChartType]);
    }
  };

  const handleChartTypeChange = (chartType: string) => {
    setSelectedChartType(chartType);

    // Get the visualization configuration for the selected chart type
    const chartConfig = visualizationRegistry.getVisualizationConfig(chartType);

    // Update the style options with the defaults for the selected chart type
    if (chartConfig && chartConfig.ui && chartConfig.ui.style) {
      setStyleOptions(chartConfig.ui.style.defaults);

      // Update the visualizationData with the new visualization type
      if (visualizationData) {
        visualizationData.visualizationType = chartConfig;
      }
    }
  };

  // Don't render if visualization is not enabled or data is not ready
  if (!expression || !visualizationData || !styleOptions) {
    return null;
  }

  return (
    <div className="exploreVisContainer">
      <Visualization<ChartType>
        expression={expression}
        searchContext={searchContext}
        styleOptions={styleOptions}
        visualizationData={visualizationData as VisualizationTypeResult<ChartType>}
        onStyleChange={handleStyleChange}
        selectedChartType={selectedChartType}
        onChartTypeChange={handleChartTypeChange}
        ReactExpressionRenderer={ReactExpressionRenderer}
      />
    </div>
  );
};
