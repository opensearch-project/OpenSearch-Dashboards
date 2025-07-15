/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './visualization_container.scss';
import { i18n } from '@osd/i18n';
import { isEmpty, isEqual } from 'lodash';
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
import { useDatasetContext } from '../../application/context/dataset_context/dataset_context';
import { ExploreServices } from '../../types';
import {
  setStyleOptions,
  setChartType as setSelectedChartType,
  setAxesMapping,
} from '../../application/utils/state_management/slices';
import {
  selectStyleOptions,
  selectChartType,
  selectAxesMapping,
} from '../../application/utils/state_management/selectors';
import { useTabResults } from '../../application/utils/hooks/use_tab_results';
import { SaveAndAddButtonWithModal } from './add_to_dashboard_button';
import { ExecutionContextSearch } from '../../../../expressions/common/';
import { ALL_VISUALIZATION_RULES } from './rule_repository';
import {
  applyDefaultVisualization,
  convertMappingsToStrings,
  convertStringsToMappings,
  findRuleByIndex,
  getAllColumns,
  getColumnMatchFromMapping,
  isValidMapping,
} from './visualization_container_utils';

export interface UpdateVisualizationProps {
  rule?: Partial<VisualizationRule>;
  mappings: AxisColumnMappings;
}

const VISUALIZATION_TOAST_MSG = {
  useRule: i18n.translate('explore.visualize.toast.useRule', {
    defaultMessage: 'Cannot apply previous configured visualization, use rule matched',
  }),
  reset: i18n.translate('explore.visualize.toast.reset', {
    defaultMessage: 'Cannot apply previous configured visualization, reset',
  }),
  metricReset: i18n.translate('explore.visualize.toast.metricReset', {
    defaultMessage: 'Cannot apply metric type visualization, reset',
  }),
  switchReset: i18n.translate('explore.visualize.toast.switchReset', {
    defaultMessage: 'Cannot apply configured visualization to the current chart type, reset',
  }),
};

export const VisualizationContainer = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const dispatch = useDispatch();
  const {
    data,
    expressions: { ReactExpressionRenderer },
  } = services;
  const { dataset } = useDatasetContext();
  const { results } = useTabResults();

  // TODO: Register custom processor for visualization tab
  // const tabDefinition = services.tabRegistry?.getTab?.('explore_visualization_tab');
  // const processor = tabDefinition?.resultsProcessor || defaultResultsProcessor;

  const rows = useMemo(() => results?.hits?.hits || [], [results]);
  const styleOptions = useSelector(selectStyleOptions);
  const selectedChartType = useSelector(selectChartType);
  const selectedAxesMapping = useSelector(selectAxesMapping);
  const fieldSchema = useMemo(() => results?.fieldSchema || [], [results]);

  const visualizationRegistry = useVisualizationRegistry();

  const [currentRuleId, setCurrentRuleId] = useState<string | undefined>(undefined);
  const [visualizationData, setVisualizationData] = useState<
    VisualizationTypeResult<ChartType> | undefined
  >(undefined);

  const isVisualizationUpdated = useRef(false);

  const updateVisualization = useCallback(
    ({ rule, mappings }: UpdateVisualizationProps) => {
      // Handle user modifiy the visualization through style panel manually
      isVisualizationUpdated.current = true;

      setVisualizationData((prev) => ({
        ...prev,
        axisColumnMappings: mappings,
        ...(rule && { ruleId: rule.id, toExpression: rule.toExpression }),
      }));

      dispatch(setAxesMapping(convertMappingsToStrings(mappings)));
      if (rule) setCurrentRuleId(rule.id);
    },
    [dispatch]
  );

  const originalVisualizationData = useRef<VisualizationTypeResult<ChartType> | undefined>(
    undefined
  );

  useEffect(() => {
    if (isVisualizationUpdated.current || fieldSchema.length === 0 || rows.length === 0) {
      return;
    }

    const visualizationTypeResult = getVisualizationType(rows, fieldSchema);

    if (!visualizationTypeResult) {
      return;
    }

    originalVisualizationData.current = visualizationTypeResult;
    const allColumns = getAllColumns(visualizationTypeResult);

    // Cannot display metric with new query result if we have more than one value
    const cannotDisplayAsMetric =
      selectedChartType === 'metric' && allColumns[0].uniqueValuesCount > 1;

    if (
      visualizationTypeResult?.ruleId &&
      visualizationTypeResult.visualizationType &&
      selectedChartType !== 'table'
    ) {
      // Rule matched and visualization can be automatically generated
      if (selectedChartType && !isEmpty(selectedAxesMapping) && !isEmpty(styleOptions)) {
        // Has a visualization generated previously
        const chartConfig = visualizationRegistry.getVisualizationConfig(selectedChartType);

        // Check if the chart type and axes selection previously can continue be used on
        // the new query. The checking is based on compare current available columns and previous
        // selected axes-column mappings.
        if (!isValidMapping(selectedAxesMapping ?? {}, allColumns) || cannotDisplayAsMetric) {
          // Cannot apply, use the auto rule-matched visualization
          services.notifications.toasts.addInfo(VISUALIZATION_TOAST_MSG.useRule);

          applyDefaultVisualization(
            visualizationTypeResult,
            setCurrentRuleId,
            setVisualizationData,
            dispatch
          );
        } else {
          // Use saved visualization selections
          setVisualizationData({
            ...visualizationTypeResult,
            visualizationType: chartConfig as VisualizationType<ChartType>,
            axisColumnMappings: convertStringsToMappings(selectedAxesMapping ?? {}, allColumns),
          });
        }
      } else {
        // No visualization previously generated, directly use the rule-matched visualization
        applyDefaultVisualization(
          visualizationTypeResult,
          setCurrentRuleId,
          setVisualizationData,
          dispatch
        );
      }
    } else if (selectedChartType) {
      // No rule matched and previously selected a chart type
      const chartConfig = visualizationRegistry.getVisualizationConfig(selectedChartType);

      // Similar check with the above if branch
      if (selectedChartType === 'table') {
        dispatch(setAxesMapping(undefined));
        setVisualizationData({
          ...visualizationTypeResult,
          visualizationType: chartConfig as VisualizationType<ChartType>,
          axisColumnMappings: {},
        });
      } else if (cannotDisplayAsMetric) {
        // Empty state
        setVisualizationData(visualizationTypeResult);
        dispatch(setSelectedChartType(undefined));
        services.notifications.toasts.addInfo(VISUALIZATION_TOAST_MSG.metricReset);
      } else if (!isValidMapping(selectedAxesMapping ?? {}, allColumns)) {
        // Cannot apply, use empty state
        services.notifications.toasts.addInfo(VISUALIZATION_TOAST_MSG.reset);
        dispatch(setAxesMapping(undefined));

        setVisualizationData({
          ...visualizationTypeResult,
          visualizationType: chartConfig as VisualizationType<ChartType>,
          axisColumnMappings: {},
        });
      } else {
        // Use saved visualization selections
        const ruleToUse = findRuleByIndex(selectedAxesMapping ?? {}, allColumns);
        setCurrentRuleId(ruleToUse?.id);
        dispatch(setAxesMapping(selectedAxesMapping));
        setVisualizationData({
          ...visualizationTypeResult,
          visualizationType: chartConfig as VisualizationType<ChartType>,
          axisColumnMappings: convertStringsToMappings(selectedAxesMapping ?? {}, allColumns),
          ruleId: ruleToUse?.id,
          toExpression: ruleToUse?.toExpression,
        });
      }
    } else {
      // First loading, use the auto-matched state (can be matched visualization or empty state)
      setVisualizationData(visualizationTypeResult);
    }
  }, [
    fieldSchema,
    rows,
    selectedChartType,
    visualizationRegistry,
    dispatch,
    selectedAxesMapping,
    services.notifications.toasts,
    styleOptions,
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
      !dataset ||
      !visualizationData ||
      !styleOptions ||
      !visualizationData.transformedData
    ) {
      return null;
    }

    if (selectedChartType === 'table') {
      // TODO: we may need to use expression to render a table for PPL results
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
      dataset,
      ruleBasedToExpressionFn,
      visualizationData.transformedData,
      visualizationData.numericalColumns,
      visualizationData.categoricalColumns,
      visualizationData.dateColumns,
      styleOptions ?? {}
    );
  }, [
    searchContext,
    rows,
    dataset,
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

  const handleStyleChange = useCallback(
    (newOptions: Partial<ChartStyleControlMap[ChartType]>) => {
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
    },
    [dispatch, styleOptions]
  );

  const handleChartTypeChange = (chartType: ChartType) => {
    isVisualizationUpdated.current = true;

    dispatch(setSelectedChartType(chartType));
    // Get the visualization configuration for the selected chart type
    const chartConfig = visualizationRegistry.getVisualizationConfig(chartType);
    // Update the style options with the defaults for the selected chart type
    if (chartConfig && chartConfig.ui && chartConfig.ui.style) {
      dispatch(setStyleOptions(chartConfig.ui.style.defaults));
      // Update the visualizationData with the new visualization type
      if (visualizationData) {
        if (!isEmpty(selectedAxesMapping)) {
          // Attempt to reuse the mapping for new chart type, find the rule used firstly
          const currentRule = ALL_VISUALIZATION_RULES.find((rule) => rule.id === currentRuleId);

          if (currentRule) {
            const currentRuleInNewChartType = currentRule?.chartTypes.find(
              (chart) => chart.type === chartType
            );
            if (currentRuleInNewChartType) {
              // Find mapping for the new chart type under the same rule (combination of columns)
              const reusedMapping = chartConfig.ui.availableMappings.find((obj) =>
                isEqual(getColumnMatchFromMapping(obj.mapping), currentRule.matchIndex)
              )?.mapping[0];

              if (reusedMapping) {
                const allColumns = getAllColumns(visualizationData);

                const usedColumns = new Set<string>();
                const updatedMapping = Object.fromEntries(
                  Object.entries(reusedMapping).map(([key, config]) => {
                    const matchingColumn = Object.values(selectedAxesMapping ?? {}).find(
                      (columnName) => {
                        if (usedColumns.has(columnName)) return false;
                        const column = allColumns.find((col) => col.name === columnName);
                        return column?.schema === config.type;
                      }
                    );
                    if (matchingColumn) usedColumns.add(matchingColumn);
                    return [key, matchingColumn];
                  })
                );

                setVisualizationData({
                  ...visualizationData,
                  visualizationType: chartConfig as VisualizationType<ChartType>,
                  axisColumnMappings: convertStringsToMappings(updatedMapping, allColumns),
                  ruleId: currentRule.id,
                  toExpression: currentRule.toExpression,
                });

                dispatch(setAxesMapping(updatedMapping));
                return;
              }
            }
            services.notifications.toasts.addInfo(VISUALIZATION_TOAST_MSG.switchReset);
          }
        }
      }
      // Fallback logic, the mapping cannot be reused for the new chart type
      setVisualizationData({
        ...visualizationData,
        visualizationType: chartConfig as VisualizationType<ChartType>,
        axisColumnMappings: {},
      });
      dispatch(setAxesMapping(undefined));
    }
  };

  // Don't render if visualization is not enabled or data is not ready
  if (!visualizationData) {
    return null;
  }

  return (
    <div className="exploreVisContainer">
      <EuiFlexGroup direction="column" gutterSize="none">
        <EuiFlexItem grow={false}>
          <EuiSpacer size="s" />
        </EuiFlexItem>
        <EuiFlexItem grow={false} style={{ alignItems: 'flex-end' }}>
          <SaveAndAddButtonWithModal
            searchContext={searchContext}
            indexPattern={dataset as any}
            services={services}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={true} style={{ minHeight: 0 }}>
          <Visualization<ChartType>
            expression={expression}
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
