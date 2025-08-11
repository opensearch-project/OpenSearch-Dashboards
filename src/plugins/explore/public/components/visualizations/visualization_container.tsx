/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './visualization_container.scss';
import { EuiPanel } from '@elastic/eui';
import React, { useEffect, useMemo } from 'react';
import { useObservable } from 'react-use';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';

import './visualization_container.scss';
import { AxisColumnMappings } from './types';
import { toExpression } from './utils/to_expression';
import { useDatasetContext } from '../../application/context/dataset_context/dataset_context';
import { ExploreServices } from '../../types';
import { useTabResults } from '../../application/utils/hooks/use_tab_results';
import { useSearchContext } from '../query_panel/utils/use_search_context';
import { getVisualizationBuilder } from './visualization_builder';
import { TableVis } from './table/table_vis';
import { TableChartStyleControls } from './table/table_vis_config';
import { VisualizationEmptyState } from './visualization_empty_state';

export interface UpdateVisualizationProps {
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

  const rows = useMemo(() => results?.hits?.hits || [], [results]);
  const fieldSchema = useMemo(() => results?.fieldSchema || [], [results]);

  const visualizationBuilder = getVisualizationBuilder();
  const visualizationData = useObservable(visualizationBuilder.data$);
  const visConfig = useObservable(visualizationBuilder.visConfig$);
  const spec = useObservable(visualizationBuilder.vegaSpec$);

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
    if (!rows || !dataset || !searchContext || !spec) {
      return null;
    }

    if (visConfig?.type === 'table') {
      // TODO: we may need to use expression to render a table for PPL results
      return null;
    }

    // Create a complete expression using the toExpression function including the OpenSearch Dashboards context and the Vega spec
    return toExpression(searchContext, spec);
  }, [searchContext, rows, dataset, spec, visConfig]);

  useEffect(() => {
    visualizationBuilder.handleData(rows, fieldSchema);
  }, [rows, fieldSchema, visualizationBuilder]);

  useEffect(() => {
    visualizationBuilder.init();
    return () => {
      // reset visualization builder
      visualizationBuilder.reset();
    };
  }, [visualizationBuilder]);

  // Don't render if visualization is not enabled or data is not ready
  if (!visualizationData) {
    return null;
  }

  const hasSelectionMapping = Object.keys(visConfig?.axesMapping ?? {}).length !== 0;
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
    if (visConfig?.type === 'table') {
      return (
        <TableVis
          pageSize={(visConfig?.styles as TableChartStyleControls).pageSize}
          rows={visualizationData.transformedData ?? []}
          columns={columns}
        />
      );
    }
    return <VisualizationEmptyState />;
  };

  return (
    <div className="exploreVisContainer">
      <EuiPanel
        hasBorder={false}
        hasShadow={false}
        data-test-subj="exploreVisualizationLoader"
        className="exploreVisPanel"
        paddingSize="none"
      >
        <div className="exploreVisPanel__inner">{renderVisualization()}</div>
      </EuiPanel>
    </div>
  );
};
