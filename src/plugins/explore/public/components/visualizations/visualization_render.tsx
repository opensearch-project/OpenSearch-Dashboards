/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Observable } from 'rxjs';
import { useObservable } from 'react-use';
import dateMath from '@elastic/datemath';
import { VisData } from './visualization_builder.types';
import { TableVis } from './table/table_vis';
import { defaultTableChartStyles, TableChartStyle } from './table/table_vis_config';
import { ExecutionContextSearch } from '../../../../expressions/common/';
import { ExpressionsStart } from '../../../../expressions/public';
import { VisualizationEmptyState } from './visualization_empty_state';
import { RenderChartConfig } from './types';
import { TimeRange } from '../../../../data/public';
import { VegaRender } from './vega_render';
import { EchartsRender } from './echarts_render';
import { createVisSpec } from './utils/create_vis_spec';
import { getChartRender } from './utils/utils';

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
  pageSize: 50,
  globalAlignment: 'left',
};

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
        showStyleSelector={false}
        disableActions={false}
      />
    );
  }

  const hasSelectionMapping = Object.keys(visConfig?.axesMapping ?? {}).length !== 0;
  if (hasSelectionMapping) {
    return (
      <ChartRender
        data={visualizationData}
        config={visConfig}
        timeRange={timeRange}
        ExpressionRenderer={ExpressionRenderer}
        searchContext={searchContext}
        onSelectTimeRange={onSelectTimeRange}
      />
    );
  }

  return <VisualizationEmptyState />;
};

const ChartRender = ({
  data,
  config,
  timeRange,
  onSelectTimeRange,
  searchContext,
  ExpressionRenderer,
}: {
  data?: VisData;
  config?: RenderChartConfig;
  timeRange: TimeRange;
  onSelectTimeRange?: (timeRange?: TimeRange) => void;
  searchContext?: ExecutionContextSearch;
  ExpressionRenderer?: ExpressionsStart['ReactExpressionRenderer'];
}) => {
  const spec = useMemo(() => {
    return createVisSpec({ data, config, timeRange });
  }, [config, data, timeRange]);

  if (getChartRender() === 'echarts') {
    return <EchartsRender spec={spec} onSelectTimeRange={onSelectTimeRange} />;
  }

  return (
    <VegaRender
      searchContext={searchContext}
      ExpressionRenderer={ExpressionRenderer}
      onSelectTimeRange={onSelectTimeRange}
      spec={spec}
    />
  );
};
