/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import './visualization_container.scss';
import { EuiFlexItem, EuiFlexGroup, EuiSpacer } from '@elastic/eui';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { Visualization } from './visualization';
import {
  getVisualizationType,
  useVisualizationRegistry,
  ChartType,
  ChartStyleControlMap,
  VisualizationTypeResult,
  VisualizationType,
  AllChartStyleControls,
} from './utils/use_visualization_types';

import './visualization_container.scss';
import { VisColumn } from './types';
import { toExpression } from './utils/to_expression';
import { useIndexPatternContext } from '../../application/components/index_pattern_context';
import { ExploreServices } from '../../types';
import {
  setStyleOptions,
  setChartType as setSelectedChartType,
  setFieldNames,
} from '../../application/utils/state_management/slices';
import {
  selectStyleOptions,
  selectChartType,
  selectFieldNames,
} from '../../application/utils/state_management/selectors';
import { useTabResults } from '../../application/utils/hooks/use_tab_results';
import { SaveAndAddButtonWithModal } from './add_to_dashboard_button';
import { ExecutionContextSearch } from '../../../../expressions/common/';

interface SelectedFieldNames {
  categorical: string[];
  date: string[];
  numerical: string[];
}

export interface UpdateVisualizationProps {
  styleDefaults: AllChartStyleControls;
  rule: string;
  fields: SelectedFieldNames;
}

export const VisualizationContainer = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const dispatch = useDispatch();
  const {
    data,
    expressions: { ReactExpressionRenderer },
  } = services;
  const { indexPattern } = useIndexPatternContext();
  const { results } = useTabResults();

  // TODO: Register custom processor for visualization tab
  // const tabDefinition = services.tabRegistry?.getTab?.('explore_visualization_tab');
  // const processor = tabDefinition?.resultsProcessor || defaultResultsProcessor;

  const rows = useMemo(() => results?.hits?.hits || [], [results]);
  const styleOptions = useSelector(selectStyleOptions);
  const selectedChartType = useSelector(selectChartType);
  const selectedFields = useSelector(selectFieldNames);
  const fieldSchema = useMemo(() => results?.fieldSchema || [], [results]);

  const visualizationRegistry = useVisualizationRegistry();

  const [currentRuleId, setCurrentRuleId] = useState<string | undefined>(undefined);

  const updateVisualization = useCallback(
    ({ styleDefaults, rule, fields }: UpdateVisualizationProps) => {
      dispatch(setStyleOptions(styleDefaults));
      dispatch(setFieldNames(fields));
      setCurrentRuleId(rule);
    },
    [dispatch]
  );

  const [visualizationData, setVisualizationData] = useState<
    VisualizationTypeResult<ChartType> | undefined
  >(undefined);

  useEffect(() => {
    if (fieldSchema.length === 0 || rows.length === 0) {
      return;
    }
    const currentVisData = getVisualizationType(rows, fieldSchema, visualizationRegistry);

    if (currentVisData) {
      setVisualizationData(currentVisData);

      const fields = {
        numerical: currentVisData.numericalColumns?.map((col) => col.name) || [],
        categorical: currentVisData.categoricalColumns?.map((col) => col.name) || [],
        date: currentVisData.dateColumns?.map((col) => col.name) || [],
      };

      if (currentVisData.visualizationType) {
        // Has rule matched by runing the query - highest priority
        dispatch(setSelectedChartType(currentVisData.visualizationType.type));
        updateVisualization({
          styleDefaults: currentVisData.visualizationType.ui.style.defaults,
          rule: currentVisData.ruleId!,
          fields,
        });
      } else if (selectedChartType) {
        // trigger render visualization with user-selected chart type and current fields
        const chartConfig = visualizationRegistry.getVisualizationConfig(selectedChartType);
        if (chartConfig) {
          const columns = {
            numerical: currentVisData.numericalColumns
              ? currentVisData.numericalColumns.filter((col) =>
                  selectedFields?.numerical?.includes(col.name)
                )
              : [],
            categorical: currentVisData.categoricalColumns
              ? currentVisData.categoricalColumns.filter((col) =>
                  selectedFields?.categorical?.includes(col.name)
                )
              : [],
            date: currentVisData.dateColumns
              ? currentVisData.dateColumns.filter((col) => selectedFields?.date?.includes(col.name))
              : [],
          };
          const matchedRule = visualizationRegistry.findBestMatch(
            columns.numerical,
            columns.categorical,
            columns.date
          );
          if (matchedRule && selectedFields) {
            updateVisualization({
              styleDefaults: chartConfig.ui.style.defaults,
              rule: matchedRule.rule.id,
              fields: selectedFields,
            });
          } else {
            dispatch(
              setFieldNames({
                numerical: [],
                categorical: [],
                date: [],
              })
            );
          }
        }
      } else {
        dispatch(
          setFieldNames({
            numerical: [],
            categorical: [],
            date: [],
          })
        );
      }
    }
    // TODO figure out why putting updateVisualization in the deps array cause infinite rerender
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldSchema, rows, selectedChartType, visualizationRegistry, dispatch]);

  const [searchContext, setSearchContext] = useState<ExecutionContextSearch>({
    query: data.query.queryString.getQuery(),
    filters: data.query.filterManager.getFilters(),
    timeRange: data.query.timefilter.timefilter.getTime(),
  });

  // Initialize selectedChartType and its default styles when visualizationData changes
  useEffect(() => {
    if (visualizationData && visualizationData.visualizationType) {
      dispatch(setSelectedChartType(visualizationData.visualizationType.type));
      dispatch(setStyleOptions(visualizationData.visualizationType.ui.style.defaults));
    }
  }, [visualizationData, dispatch]);

  // Hook to generate the expression based on the visualization type and data
  const expression = useMemo(() => {
    if (
      !rows ||
      !indexPattern ||
      !visualizationData ||
      !currentRuleId ||
      !styleOptions ||
      !selectedFields ||
      !visualizationData.transformedData
    ) {
      return null;
    }

    const rule = visualizationRegistry.getRules().find((r) => r.id === currentRuleId);

    if (!rule || !rule.toExpression) {
      return null;
    }

    const filteredNumerical = (visualizationData.numericalColumns || []).filter((col) =>
      selectedFields?.numerical?.includes(col.name)
    );
    const filteredCategorical = (visualizationData.categoricalColumns || []).filter((col) =>
      selectedFields?.categorical?.includes(col.name)
    );
    const filteredDate = (visualizationData.dateColumns || []).filter((col) =>
      selectedFields?.date?.includes(col.name)
    );

    // Don't generate expression if no fields are selected
    if (
      filteredNumerical.length === 0 &&
      filteredCategorical.length === 0 &&
      filteredDate.length === 0
    ) {
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
      filteredNumerical,
      filteredCategorical,
      filteredDate,
      styleOptions ?? {}
    );
  }, [
    selectedFields,
    searchContext,
    rows,
    indexPattern,
    styleOptions,
    visualizationData,
    visualizationRegistry,
    selectedChartType,
    currentRuleId,
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
  }, [data.query.queryString, services.data.query.state$]);

  const handleStyleChange = (newOptions: Partial<ChartStyleControlMap[ChartType]>) => {
    if (styleOptions) {
      // TODO: needs proper refactor
      // 1. The below `setStyleOptions` call
      // 2. Another `setStyleOptions` triggered above via:
      //    dispatch(setStyleOptions(visualizationData.visualizationType.ui.style.defaults));
      //
      // Root cause:
      // HeatmapVisStyleControls currently performs default style initialization inside a `useEffect`,
      // which internally calls `updateStyleOption`. This introduces a race condition when initializing styles.
      //
      // Proper solution:
      // Refactor HeatmapVisStyleControls (and any other style controls components) to **not** handle default style initialization.
      // Instead, this logic should be centralized and performed earlier, during the visualization type resolution phase.
      //
      // Replace static access to `visualizationData.visualizationType.ui.style.defaults` with a method like:
      //   `visualizationData.visualizationType.ui.style.getDefaults(rows, fieldSchema)`
      // This allows default styles to be computed dynamically based on actual data (`rows`, `fieldSchema`),
      // avoiding conflicts during rendering.
      setTimeout(() => {
        dispatch(
          setStyleOptions({
            ...styleOptions,
            ...newOptions,
          } as ChartStyleControlMap[ChartType])
        );
      }, 50);
    }
  };

  const handleChartTypeChange = (chartType: ChartType) => {
    dispatch(setSelectedChartType(chartType));

    // Get the visualization configuration for the selected chart type
    const chartConfig = visualizationRegistry.getVisualizationConfig(chartType);

    // Update the style options with the defaults for the selected chart type
    if (chartConfig && chartConfig.ui && chartConfig.ui.style) {
      dispatch(setStyleOptions(chartConfig.ui.style.defaults));

      // Update the visualizationData with the new visualization type
      if (visualizationData) {
        setVisualizationData({
          ...visualizationData,
          visualizationType: chartConfig as VisualizationType<ChartType>,
        });
      }
    }
  };

  // Don't render if visualization is not enabled or data is not ready
  if (!visualizationData) {
    return null;
  }

  return (
    <div className="exploreVisContainer">
      <EuiFlexGroup direction="column" gutterSize="xs" justifyContent="center">
        <EuiFlexItem>
          <EuiSpacer size="s" />
        </EuiFlexItem>
        <EuiFlexItem style={{ alignItems: 'flex-end' }}>
          <SaveAndAddButtonWithModal
            searchContext={searchContext}
            indexPattern={indexPattern}
            services={services}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={true}>
          <Visualization<ChartType>
            expression={expression!}
            searchContext={searchContext}
            styleOptions={styleOptions}
            visualizationData={visualizationData as VisualizationTypeResult<ChartType>}
            onStyleChange={handleStyleChange}
            selectedChartType={selectedChartType}
            onChartTypeChange={handleChartTypeChange}
            ReactExpressionRenderer={ReactExpressionRenderer}
            setVisualizationData={setVisualizationData}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};
