/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo } from 'react';
import { Observable } from 'rxjs';
import { useObservable } from 'react-use';
import dateMath from '@elastic/datemath';
import { VisData } from './visualization_builder.types';
import { TableVis } from './table/table_vis';
import { defaultTableChartStyles, TableChartStyle } from './table/table_vis_config';
import { convertStringsToMappings } from './visualization_builder_utils';
import { ExecutionContextSearch } from '../../../../expressions/common/';
import { toExpression } from './utils/to_expression';
import { ExpressionRendererEvent, ExpressionsStart } from '../../../../expressions/public';
import { VisualizationEmptyState } from './visualization_empty_state';
import { visualizationRegistry } from './visualization_registry';
import { RenderChartConfig } from './types';
import { opensearchFilters, TimeRange } from '../../../../data/public';

interface Props {
  data$: Observable<VisData | undefined>;
  config$: Observable<RenderChartConfig | undefined>;
  showRawTable$: Observable<boolean>;
  searchContext?: ExecutionContextSearch;
  ExpressionRenderer?: ExpressionsStart['ReactExpressionRenderer'];
  onSelectTimeRange?: (timeRange?: TimeRange) => void;
  onStyleChange?: (updatedStyle: Partial<TableChartStyle>) => void;
}

const defaultStyleOptions: TableChartStyle = {
  ...defaultTableChartStyles,
  showColumnFilter: false,
  showFooter: false,
  pageSize: 10,
  globalAlignment: 'left',
};

const PAGE_SIZE_OPTIONS = [10, 50, 100];

export const VisualizationRender = ({
  data$,
  config$,
  showRawTable$,
  searchContext,
  ExpressionRenderer,
  onSelectTimeRange,
  onStyleChange,
}: Props) => {
  const visualizationData = useObservable(data$);
  const visConfig = useObservable(config$);
  const showRawTable = useObservable(showRawTable$);
  const { from, to } = searchContext?.timeRange || {};

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

  const timeRange = useMemo(() => {
    return {
      from: from ? dateMath.parse(from)?.format('YYYY-MM-DDTHH:mm:ss.SSSZ') ?? '' : '',
      to: to ? dateMath.parse(to, { roundUp: true })?.format('YYYY-MM-DDTHH:mm:ss.SSSZ') ?? '' : '',
    };
  }, [from, to]);

  const spec = useMemo(() => {
    if (!visualizationData) {
      return;
    }

    if (!visConfig?.type) {
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
      visConfig.styles,
      visConfig.type,
      axisColumnMappings,
      timeRange
    );
  }, [columns, visConfig, visualizationData, timeRange]);

  const onExpressionEvent = useCallback(
    async (e: ExpressionRendererEvent) => {
      if (!onSelectTimeRange) {
        return;
      }
      if (e.name === 'applyFilter') {
        if (e.data && e.data.filters) {
          const { timeRange: extractedTimeRange } = opensearchFilters.extractTimeRange(
            e.data.filters,
            e.data.timeFieldName
          );
          onSelectTimeRange(extractedTimeRange);
        }
      }
    },
    [onSelectTimeRange]
  );

  if (!visualizationData || columns.length === 0) {
    return null;
  }

  if (visConfig?.type === 'table') {
    return (
      <TableVis
        styleOptions={visConfig.styles as TableChartStyle}
        rows={rows}
        columns={columns}
        onStyleChange={onStyleChange}
        disableActions={false}
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
        disableActions={false}
      />
    );
  }

  const hasSelectionMapping = Object.keys(visConfig?.axesMapping ?? {}).length !== 0;
  if (hasSelectionMapping) {
    if (!ExpressionRenderer) {
      return null;
    }
    const expression = toExpression(searchContext, spec);
    return (
      <ExpressionRenderer
        key={JSON.stringify(searchContext) + expression}
        expression={expression}
        searchContext={searchContext}
        onEvent={onExpressionEvent}
      />
    );
  }

  return <VisualizationEmptyState />;
};
