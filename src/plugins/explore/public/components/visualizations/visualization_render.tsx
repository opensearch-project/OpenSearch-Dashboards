/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { BehaviorSubject } from 'rxjs';
import { useObservable } from 'react-use';
import { ChartConfig, VisData } from './visualization_builder.types';
import { TableVis } from './table/table_vis';
import { TableChartStyleControls } from './table/table_vis_config';
import { convertStringsToMappings } from './visualization_builder_utils';
import { ExecutionContextSearch } from '../../../../expressions/common/';
import { toExpression } from './utils/to_expression';
import { ExpressionsStart } from '../../../../expressions/public';
import { VisualizationEmptyState } from './visualization_empty_state';
import { visualizationRegistry } from './visualization_registry';

interface Props {
  data$: BehaviorSubject<VisData | undefined>;
  visConfig$: BehaviorSubject<ChartConfig | undefined>;
  showRawTable$: BehaviorSubject<boolean>;
  searchContext?: ExecutionContextSearch;
  ExpressionRenderer?: ExpressionsStart['ReactExpressionRenderer'];
}

const defaultStyleOptions: TableChartStyleControls = {
  showColumnFilter: false,
  showFooter: false,
  pageSize: 10,
  globalAlignment: 'left',
};

const PAGE_SIZE_OPTIONS = [10, 50, 100];

export const VisualizationRender = (props: Props) => {
  const visualizationData = useObservable(props.data$);
  const visConfig = useObservable(props.visConfig$);
  const showRawTable = useObservable(props.showRawTable$);
  const rows = useMemo(() => {
    return visualizationData?.transformedData ?? [];
  }, [visualizationData?.transformedData]);

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

  const spec = useMemo(() => {
    if (!visualizationData) {
      return;
    }
    const rule = visualizationRegistry.findRuleByAxesMapping(visConfig?.axesMapping ?? {}, columns);
    if (!rule || !rule.toSpec) {
      return;
    }
    const axisColumnMappings = convertStringsToMappings(visConfig?.axesMapping ?? {}, columns);
    return rule.toSpec(
      visualizationData.transformedData,
      visualizationData.numericalColumns,
      visualizationData.categoricalColumns,
      visualizationData.dateColumns,
      visConfig?.styles,
      visConfig?.type,
      axisColumnMappings
    );
  }, [columns, visConfig, visualizationData]);

  if (!visualizationData) {
    return null;
  }

  if (visConfig?.type === 'table') {
    return (
      <TableVis
        styleOptions={visConfig?.styles as TableChartStyleControls}
        rows={visualizationData?.transformedData ?? []}
        columns={columns}
      />
    );
  }

  if (showRawTable) {
    return (
      <TableVis
        // This key ensures re-rendering when switching to table visualization
        // from a non-table visualization with the "show raw data" option enabled
        key="table-vis-raw"
        rows={rows}
        columns={columns}
        styleOptions={defaultStyleOptions}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        showStyleSelector={false}
      />
    );
  }

  const hasSelectionMapping = Object.keys(visConfig?.axesMapping ?? {}).length !== 0;
  if (hasSelectionMapping) {
    if (!props.ExpressionRenderer) {
      return null;
    }
    const expression = toExpression(props.searchContext, spec);
    return (
      <props.ExpressionRenderer
        key={JSON.stringify(props.searchContext) + expression}
        expression={expression}
        searchContext={props.searchContext}
      />
    );
  }

  return <VisualizationEmptyState />;
};
