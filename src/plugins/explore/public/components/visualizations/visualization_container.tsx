/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import './visualization_container.scss';
import { EuiFlexItem, EuiFlexGroup, EuiSpacer } from '@elastic/eui';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
} from './utils/use_visualization_types';

import './visualization_container.scss';
import { AxisColumnMappings, VisColumn, VisualizationRule } from './types';
import { toExpression } from './utils/to_expression';
import { useIndexPatternContext } from '../../application/components/index_pattern_context';
import { ExploreServices } from '../../types';
import {
  setStyleOptions,
  setChartType as setSelectedChartType,
} from '../../application/utils/state_management/slices';
import {
  selectStyleOptions,
  selectChartType,
} from '../../application/utils/state_management/selectors';
import { useTabResults } from '../../application/utils/hooks/use_tab_results';
import { SaveAndAddButtonWithModal } from './add_to_dashboard_button';
import { ExecutionContextSearch } from '../../../../expressions/common/';

export interface UpdateVisualizationProps {
  rule: Partial<VisualizationRule>;
  mappings?: AxisColumnMappings;
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
  const fieldSchema = useMemo(() => results?.fieldSchema || [], [results]);

  const visualizationRegistry = useVisualizationRegistry();

  const [currentRuleId, setCurrentRuleId] = useState<string | undefined>(undefined);
  const [visualizationData, setVisualizationData] = useState<
    VisualizationTypeResult<ChartType> | undefined
  >(undefined);

  const isVisualizationUpdated = useRef(false);

  const updateVisualizationState = useCallback(
    (
      visualizationType: VisualizationType<ChartType>
      // fieldNames: { numerical: string[]; categorical: string[]; date: string[] }
    ) => {
      dispatch(setSelectedChartType(visualizationType.type));
      dispatch(setStyleOptions(visualizationType.ui.style.defaults));
      // dispatch(setFieldNames(fieldNames));
    },
    [dispatch]
  );

  const updateVisualization = useCallback(({ rule, mappings }: UpdateVisualizationProps) => {
    // Handle user modifiy the visualization through style panel manually
    isVisualizationUpdated.current = true;

    setVisualizationData((prev) => ({
      ...prev,
      axisColumnMappings: mappings,
      ruleId: rule ? rule.id : undefined,
      toExpression: rule ? rule.toExpression : undefined,
    }));

    setCurrentRuleId(rule ? rule.id : '');
  }, []);

  // const findMatchedRuleWithCache = useCallback(
  //   ({
  //     visData,
  //     fieldNames,
  //   }: {
  //     visData: VisualizationTypeResult<ChartType>;
  //     fieldNames: UpdateVisualizationProps['fieldNames'];
  //   }) => {
  //     const columns = {
  //       numerical: visData.numericalColumns
  //         ? visData.numericalColumns.filter((col) => fieldNames?.numerical?.includes(col.name))
  //         : [],
  //       categorical: visData.categoricalColumns
  //         ? visData.categoricalColumns.filter((col) => fieldNames?.categorical?.includes(col.name))
  //         : [],
  //       date: visData.dateColumns
  //         ? visData.dateColumns.filter((col) => fieldNames?.date?.includes(col.name))
  //         : [],
  //     };
  //     // Will return null if not found
  //     return {
  //       matchedRule: visualizationRegistry.findBestMatch(
  //         columns.numerical,
  //         columns.categorical,
  //         columns.date
  //       ),
  //       columns,
  //     };
  //   },
  //   [visualizationRegistry]
  // );

  // const clearCache = useCallback(() => {
  //   dispatch(setSelectedChartType('' as any)); // FIXME
  //   dispatch(setStyleOptions({} as any)); // FIXME
  //   dispatch(setFieldNames({ numerical: [], categorical: [], date: [] }));

  //   isVisualizationUpdated.current = true;
  // }, [dispatch]);

  useEffect(() => {
    if (fieldSchema.length === 0 || rows.length === 0) {
      return;
    }

    // if (isVisualizationUpdated.current) {
    //   // Avoid being triggered by empty state component updates
    //   return;
    // }

    const visualizationTypeResult = getVisualizationType(rows, fieldSchema);

    if (visualizationTypeResult) {
      // Always set the data from the query as it should be the single source of truth

      if (selectedChartType && !visualizationTypeResult.visualizationType) {
        const chartConfig = visualizationRegistry.getVisualizationConfig(selectedChartType);
        setVisualizationData({
          ...visualizationTypeResult,
          visualizationType: chartConfig as VisualizationType<ChartType>,
        });
      } else {
        setVisualizationData(visualizationTypeResult);
        updateVisualizationState(visualizationTypeResult.visualizationType!);
      }

      setCurrentRuleId(visualizationTypeResult.ruleId);

      // // Map from visualization columns to the field names
      // const availableFieldNames = {
      //   numerical: visualizationTypeResult.numericalColumns?.map((col) => col.name) || [],
      //   categorical: visualizationTypeResult.categoricalColumns?.map((col) => col.name) || [],
      //   date: visualizationTypeResult.dateColumns?.map((col) => col.name) || [],
      // };

      // if (visualizationTypeResult?.ruleId && visualizationTypeResult.visualizationType) {
      //   // Highest priority when rule matched so the visualization should automatically generate
      //   setCurrentRuleId(visualizationTypeResult.ruleId);
      //   updateVisualizationState(visualizationTypeResult.visualizationType, availableFieldNames);

      //   isVisualizationUpdated.current = true;
      // } else if (selectedChartType) {
      //   // Populate and trigger render visualization with user-selected chart/fields

      //   const hasInvalidFields =
      //     selectedFieldNames &&
      //     (selectedFieldNames.numerical?.some(
      //       (field) => !availableFieldNames.numerical.includes(field)
      //     ) ||
      //       selectedFieldNames.categorical?.some(
      //         (field) => !availableFieldNames.categorical.includes(field)
      //       ) ||
      //       selectedFieldNames.date?.some((field) => !availableFieldNames.date.includes(field)));

      //   if (hasInvalidFields) {
      //     // Previous selected fields contains a field that no longer exist in the current query
      //     clearCache();
      //   } else {
      //     if (selectedFieldNames) {
      //       const { matchedRule, columns } = findMatchedRuleWithCache({
      //         visData: visualizationTypeResult,
      //         fieldNames: selectedFieldNames,
      //       });
      //       if (matchedRule) {
      //         // The previous query is empty-stated but visualization is generated by user selection
      //         const visType = visualizationRegistry.getVisualizationConfig(
      //           selectedChartType
      //         ) as VisualizationType<ChartType>;

      //         // Trigger the generation of visualization that the user previously created
      //         requestAnimationFrame(() => {
      //           setCurrentRuleId(matchedRule.rule.id);
      //           setVisualizationData({
      //             ...visualizationTypeResult,
      //             visualizationType: visType,
      //             numericalColumns: columns.numerical,
      //             categoricalColumns: columns.categorical,
      //             dateColumns: columns.date,
      //             ruleId: matchedRule.rule.id,
      //             toExpression: matchedRule.rule.toExpression,
      //           });
      //         });
      //       }
      //     }

      //     isVisualizationUpdated.current = true;
      //   }
      // } else {
      //   // No visualization automatically created and the user also previously didn't build a visualization
      //   clearCache();
      // }
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [
    fieldSchema,
    // selectedFieldNames,
    rows,
    updateVisualizationState,
    // dispatch,
    // selectedChartType,
    // clearCache,
    // findMatchedRuleWithCache,
    visualizationRegistry,
  ]);

  const [searchContext, setSearchContext] = useState<ExecutionContextSearch>({
    query: data.query.queryString.getQuery(),
    filters: data.query.filterManager.getFilters(),
    timeRange: data.query.timefilter.timefilter.getTime(),
  });

  // Hook to generate the expression based on the visualization type and data
  const expression = useMemo(() => {
    if (
      !rows ||
      !indexPattern ||
      !visualizationData ||
      !currentRuleId ||
      !styleOptions ||
      !visualizationData.transformedData
    ) {
      return null;
    }

    const rule = visualizationRegistry.getRules().find((r) => r.id === currentRuleId);

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
        selectedChartType,
        visualizationData.axisColumnMappings
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
      styleOptions ?? {},
      visualizationData.axisColumnMappings
    );
  }, [
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
          axisColumnMappings: {},
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
            updateVisualization={updateVisualization}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};
