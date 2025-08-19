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
import { convertStringsToMappings, findRuleByIndex } from './visualization_builder_utils';
import { ExecutionContextSearch } from '../../../../expressions/common/';
import { toExpression } from './utils/to_expression';
import { ExpressionsStart } from '../../../../expressions/public';
import { VisualizationEmptyState } from './visualization_empty_state';

interface Props {
  data$: BehaviorSubject<VisData | undefined>;
  visConfig$: BehaviorSubject<ChartConfig | undefined>;
  searchContext?: ExecutionContextSearch;
  ExpressionRenderer?: ExpressionsStart['ReactExpressionRenderer'];
}

export const VisualizationRender = (props: Props) => {
  const visualizationData = useObservable(props.data$);
  const visConfig = useObservable(props.visConfig$);

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
    const rule = findRuleByIndex(visConfig?.axesMapping ?? {}, columns);
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
