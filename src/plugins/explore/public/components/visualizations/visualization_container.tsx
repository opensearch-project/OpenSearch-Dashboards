/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './visualization_container.scss';
import { EuiFlexItem, EuiFlexGroup, EuiPanel, EuiEmptyPrompt } from '@elastic/eui';
import React, { useEffect, useMemo } from 'react';
import { useObservable } from 'react-use';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';

import './visualization_container.scss';
import { AxisColumnMappings, VisColumn, VisualizationRule } from './types';
import { toExpression } from './utils/to_expression';
import { useDatasetContext } from '../../application/context/dataset_context/dataset_context';
import { ExploreServices } from '../../types';
import { useTabResults } from '../../application/utils/hooks/use_tab_results';
import { convertStringsToMappings, findRuleByIndex } from './visualization_container_utils';
import { useSearchContext } from '../query_panel/utils/use_search_context';
import { getVisualizationBuilder } from './visualization_builder';
import { StylePanel } from './style_panel/style_panel';
import { TableVis } from './table/table_vis';
import { TableChartStyleControls } from './table/table_vis_config';

export interface UpdateVisualizationProps {
  rule?: Partial<VisualizationRule>;
  mappings: AxisColumnMappings;
}
// TODO: add back notifications
// const VISUALIZATION_TOAST_MSG = {
//   useRule: i18n.translate('explore.visualize.toast.useRule', {
//     defaultMessage: 'Cannot apply previous configured visualization, use rule matched',
//   }),
//   reset: i18n.translate('explore.visualize.toast.reset', {
//     defaultMessage: 'Cannot apply previous configured visualization, reset',
//   }),
//   metricReset: i18n.translate('explore.visualize.toast.metricReset', {
//     defaultMessage: 'Cannot apply metric type visualization, reset',
//   }),
//   switchReset: i18n.translate('explore.visualize.toast.switchReset', {
//     defaultMessage: 'Cannot apply configured visualization to the current chart type, reset',
//   }),
// };

export const VisualizationContainer = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const {
    expressions: { ReactExpressionRenderer },
  } = services;
  const { dataset } = useDatasetContext();
  const { results } = useTabResults();
  const searchContext = useSearchContext();

  // TODO: Register custom processor for visualization tab
  // const tabDefinition = services.tabRegistry?.getTab?.('explore_visualization_tab');
  // const processor = tabDefinition?.resultsProcessor || defaultResultsProcessor;

  const rows = useMemo(() => results?.hits?.hits || [], [results]);
  const fieldSchema = useMemo(() => results?.fieldSchema || [], [results]);

  const visualizationBuilder = getVisualizationBuilder();
  const visualizationData = useObservable(visualizationBuilder.data$);
  const axesMappings = useObservable(visualizationBuilder.axesMapping$);
  const styleOptions = useObservable(visualizationBuilder.styles$);
  const selectedChartType = useObservable(visualizationBuilder.currentChartType$);

  const columns = useMemo(() => {
    return [
      ...(visualizationData?.numericalColumns ?? []),
      ...(visualizationData?.categoricalColumns ?? []),
      ...(visualizationData?.dateColumns ?? []),
    ];
  }, [
    visualizationData?.numericalColumns,
    visualizationData?.categoricalColumns,
    visualizationData?.dateColumns,
  ]);

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

    const rule = findRuleByIndex(axesMappings ?? {}, columns);
    // const rule = visualizationRegistry.getRules().find((r) => r.id === currentRuleId);

    if (!rule || !rule.toExpression) {
      return null;
    }
    const axisColumnMappings = convertStringsToMappings(axesMappings ?? {}, [
      ...visualizationData.numericalColumns,
      ...visualizationData.categoricalColumns,
      ...visualizationData.dateColumns,
    ]);

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
        styleOpts.styles,
        styleOpts.type,
        axisColumnMappings
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
    selectedChartType,
    axesMappings,
    columns,
  ]);

  useEffect(() => {
    visualizationBuilder.handleData(rows, fieldSchema);
  }, [rows, fieldSchema, visualizationBuilder]);

  useEffect(() => {
    visualizationBuilder.init({});
    return () => {
      // reset visualization builder
      visualizationBuilder.reset();
    };
  }, [visualizationBuilder]);

  // Don't render if visualization is not enabled or data is not ready
  if (!visualizationData) {
    return null;
  }

  const hasSelectionMapping = Object.keys(axesMappings ?? {}).length !== 0;
  const renderVisualization = () => {
    if (expression && hasSelectionMapping) {
      return (
        <ReactExpressionRenderer
          key={JSON.stringify(searchContext) + expression}
          expression={expression}
          searchContext={searchContext}
        />
      );
    }
    if (selectedChartType === 'table') {
      return (
        <TableVis
          pageSize={(styleOptions?.styles as TableChartStyleControls).pageSize}
          rows={visualizationData.transformedData ?? []}
          columns={columns}
        />
      );
    }
    return (
      <EuiEmptyPrompt
        iconType="visualizeApp"
        title={<h2>Select a chart type, and x and y axes fields to get started</h2>}
        body={<p>Try writing an aggregated query like this one:</p>}
      />
    );
  };

  return (
    <div className="exploreVisContainer">
      <EuiFlexGroup gutterSize="none" style={{ minHeight: 0, width: '100%' }}>
        <EuiFlexItem style={{ minWidth: 0 }}>
          <EuiPanel
            hasBorder={false}
            hasShadow={false}
            data-test-subj="exploreVisualizationLoader"
            className="exploreVisPanel"
          >
            <div className="exploreVisPanel__inner">{renderVisualization()}</div>
          </EuiPanel>
        </EuiFlexItem>
        <EuiFlexItem grow={false} className="exploreVisStyleFlexItem">
          <StylePanel visualizationBuilder={visualizationBuilder} />
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};
