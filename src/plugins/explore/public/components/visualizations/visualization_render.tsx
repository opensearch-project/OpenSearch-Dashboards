/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { Observable } from 'rxjs';
import { useObservable } from 'react-use';
import dateMath from '@elastic/datemath';

import { VisData } from './visualization_builder.types';
import { TableVis } from './table/table_vis';
import { defaultTableChartStyles, TableChartStyle } from './table/table_vis_config';
import { VisualizationEmptyState } from './visualization_empty_state';
import { RenderChartConfig } from './types';
import { TimeRange } from '../../../../data/public';
import { visualizationRegistry } from './visualization_registry';
import { convertStringsToMappings } from './visualization_builder_utils';
import { getAxisConfigByColumnMapping } from './utils/axis';
import { groupDataBySplitField } from './utils/group_data_by_split';
import { SplitContainer } from './split_container';

interface Props {
  data$: Observable<VisData | undefined>;
  config$: Observable<RenderChartConfig | undefined>;
  showRawTable$: Observable<boolean>;
  timeRange?: TimeRange;
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
  timeRange: inputTimeRange,
  onSelectTimeRange,
  onStyleChange,
}: Props) => {
  const visualizationData = useObservable(data$);
  const visConfig = useObservable(config$);
  const showRawTable = useObservable(showRawTable$);
  const { from, to } = inputTimeRange || {};

  const timeRange = useMemo(() => {
    return {
      from: from ? dateMath.parse(from)?.format('YYYY-MM-DDTHH:mm:ss.SSSZ') ?? '' : '',
      to: to ? dateMath.parse(to, { roundUp: true })?.format('YYYY-MM-DDTHH:mm:ss.SSSZ') ?? '' : '',
    };
  }, [from, to]);

  const rows = useMemo(() => {
    return visualizationData?.transformedData ?? [];
  }, [visualizationData?.transformedData]);

  const columns = useMemo(() => {
    return [
      ...(visualizationData?.numericalColumns ?? []),
      ...(visualizationData?.categoricalColumns ?? []),
      ...(visualizationData?.dateColumns ?? []),
      ...(visualizationData?.unknownColumns ?? []),
    ];
  }, [
    visualizationData?.numericalColumns,
    visualizationData?.categoricalColumns,
    visualizationData?.dateColumns,
    visualizationData?.unknownColumns,
  ]);

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

  // Split grouping: when splitField is configured and chart type is not 'table',
  // group data by the split field and render via SplitContainer
  if (visConfig?.splitField) {
    const splitColumn = columns.find((col) => col.name === visConfig.splitField);
    if (splitColumn) {
      const groups = groupDataBySplitField(rows, splitColumn.column);

      return (
        <SplitContainer
          groups={groups}
          layout={visConfig.splitLayout ?? 'auto'}
          showLabel={visConfig.showSplitLabel}
          renderChart={(groupData) => (
            <ChartRender
              data={{ ...visualizationData, transformedData: groupData }}
              config={visConfig}
              timeRange={timeRange}
              onSelectTimeRange={onSelectTimeRange}
            />
          )}
        />
      );
    }
    // splitField references non-existent column: fall through to ungrouped single-chart render
  }

  const hasSelectionMapping = Object.keys(visConfig?.axesMapping ?? {}).length !== 0;
  if (hasSelectionMapping) {
    return (
      <ChartRender
        data={visualizationData}
        config={visConfig}
        timeRange={timeRange}
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
}: {
  data?: VisData;
  config?: RenderChartConfig;
  timeRange: TimeRange;
  onSelectTimeRange?: (timeRange?: TimeRange) => void;
}) => {
  if (!data) {
    return null;
  }

  if (!config?.type) {
    return null;
  }

  const columns = [
    ...(data?.numericalColumns ?? []),
    ...(data?.categoricalColumns ?? []),
    ...(data?.dateColumns ?? []),
  ];

  const rule = visualizationRegistry.findRuleByAxesMapping(
    config.type,
    config.axesMapping ?? {},
    columns
  );
  if (!rule) {
    return null;
  }
  const standardAxes = 'standardAxes' in config.styles ? config.styles.standardAxes : [];
  const axisColumnMappings = convertStringsToMappings(config?.axesMapping ?? {}, columns);
  // initialize axis config
  const allAxisConfig = getAxisConfigByColumnMapping(axisColumnMappings, standardAxes);
  const styles = { ...config.styles, standardAxes: allAxisConfig };

  return rule.render({
    transformedData: data.transformedData,
    styleOptions: styles,
    axisColumnMappings,
    timeRange,
    onSelectTimeRange,
  });
};
