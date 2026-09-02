/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Observable, BehaviorSubject } from 'rxjs';
import { useObservable } from 'react-use';
import dateMath from '@elastic/datemath';

import { VisData } from './visualization_builder.types';
import { TableVis } from './table/table_vis';
import { defaultTableChartStyles, TableChartStyle } from './table/table_vis_config';
import { VisualizationEmptyState } from './visualization_empty_state';
import { Positions, RenderChartConfig } from './types';
import { TimeRange } from '../../../../data/public';
import { visualizationRegistry } from './visualization_registry';
import { convertStringsToMappings } from './visualization_builder_utils';
import { getAxisConfigByColumnMapping } from './utils/axis';
import { filterDataBySplitField, getSplitKeysBySplitField } from './utils/group_data_by_split';
import { SplitContainer } from './split_container';
import { CustomLegend } from './custom_legend';
import type { VisualizationRenderContext } from './utils/use_visualization_types';
import { LegendItem, LegendTarget } from './utils/legend';

interface Props {
  data$: Observable<VisData | undefined>;
  config$: Observable<RenderChartConfig | undefined>;
  showRawTable$: Observable<boolean>;
  timeRange?: TimeRange;
  onSelectTimeRange?: (timeRange?: TimeRange) => void;
  onStyleChange?: (updatedStyle: Partial<TableChartStyle>) => void;
  crosshairGroup?: string;
}

interface CommonProps {
  visualizationData: VisData | undefined;
  visConfig: RenderChartConfig | undefined;
  showRawTable: boolean;
  timeRange?: TimeRange;
  onSelectTimeRange?: (timeRange?: TimeRange) => void;
  onStyleChange?: (updatedStyle: Partial<TableChartStyle>) => void;
  crosshairGroup?: string;
}

const defaultStyleOptions: TableChartStyle = {
  ...defaultTableChartStyles,
  showColumnFilter: false,
  showFooter: false,
  pageSize: 50,
  globalAlignment: 'left',
};

const CUSTOM_LEGEND_CHART_TYPES = ['area', 'line', 'bar', 'pie', 'scatter', 'state_timeline'];
const COMPACT_HORIZONTAL_SPLIT_CHART_TYPES = ['gauge', 'pie'];
const COMPACT_HORIZONTAL_SPLIT_MIN_WIDTH = 180;

export const CommonVisualizationRender = ({
  visualizationData,
  visConfig,
  showRawTable,
  timeRange: inputTimeRange,
  onSelectTimeRange,
  onStyleChange,
  crosshairGroup,
}: CommonProps) => {
  const { from, to } = inputTimeRange || {};
  const legendSelected$ = useRef(new BehaviorSubject<Record<string, boolean>>({})).current;
  const highlightedLegendTarget$ = useRef(
    new BehaviorSubject<LegendTarget | undefined>(undefined)
  ).current;
  const legend$ = useRef(new BehaviorSubject<Record<string, LegendItem[]>>({})).current;
  const supportsCustomLegend = CUSTOM_LEGEND_CHART_TYPES.includes(visConfig?.type ?? '');
  const horizontalSplitMinWidth = COMPACT_HORIZONTAL_SPLIT_CHART_TYPES.includes(
    visConfig?.type ?? ''
  )
    ? COMPACT_HORIZONTAL_SPLIT_MIN_WIDTH
    : undefined;

  useEffect(() => {
    if (!supportsCustomLegend) {
      legend$.next({});
    }
  }, [supportsCustomLegend, legend$]);

  const timeRange = useMemo(() => {
    return {
      from: from ? (dateMath.parse(from)?.format('YYYY-MM-DDTHH:mm:ss.SSSZ') ?? '') : '',
      to: to
        ? (dateMath.parse(to, { roundUp: true })?.format('YYYY-MM-DDTHH:mm:ss.SSSZ') ?? '')
        : '',
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

  const onLegend = useCallback(
    (key: string, legendItems: LegendItem[], validKeys?: string[]) => {
      const current = legend$.getValue();
      let next = { ...current, [key]: legendItems };
      if (validKeys) {
        const pruned: Record<string, LegendItem[]> = {};
        validKeys.forEach((k) => {
          if (next[k]) pruned[k] = next[k];
        });
        next = pruned;
      }
      legend$.next(next);
    },
    [legend$]
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
        key="table-vis-raw"
        rows={rows}
        columns={columns}
        styleOptions={defaultStyleOptions}
        showStyleSelector={false}
        disableActions={false}
      />
    );
  }

  const showLegend =
    visConfig?.styles && 'addLegend' in visConfig.styles ? visConfig.styles.addLegend : false;
  const legendPosition =
    visConfig?.styles && 'legendPosition' in visConfig.styles
      ? visConfig.styles.legendPosition
      : Positions.BOTTOM;
  const isHorizontalLayout =
    legendPosition === Positions.LEFT || legendPosition === Positions.RIGHT;
  const isLegendAfter = legendPosition === Positions.BOTTOM || legendPosition === Positions.RIGHT;

  const renderLegend = () =>
    supportsCustomLegend &&
    showLegend && (
      <CustomLegend
        legend$={legend$}
        legendSelected$={legendSelected$}
        highlightedLegendTarget$={highlightedLegendTarget$}
        position={legendPosition}
      />
    );

  // Split grouping: when splitField is configured and chart type is not 'table',
  // group data by the split field and render via SplitContainer
  if (visConfig?.splitField) {
    const splitColumn = columns.find((col) => col.name === visConfig.splitField);
    if (splitColumn) {
      const groups = getSplitKeysBySplitField(rows, splitColumn.column);

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: isHorizontalLayout ? 'row' : 'column',
            height: '100%',
          }}
        >
          {!isLegendAfter && renderLegend()}
          <div style={{ flex: 1, minHeight: 0, minWidth: 0 }}>
            <SplitContainer
              groups={groups}
              layout={visConfig.splitLayout ?? 'auto'}
              showLabel={visConfig.showSplitLabel}
              verticalItemMinHeight={visConfig.type === 'metric' ? 60 : undefined}
              horizontalItemMinWidth={horizontalSplitMinWidth}
              renderChart={(groupKey) => (
                <ChartRender
                  data={{ ...visualizationData }}
                  dataFilter={(data) => filterDataBySplitField(data, splitColumn.column, groupKey)}
                  config={visConfig}
                  renderContext={{
                    seriesName: groupKey,
                    crosshairGroup,
                  }}
                  onLegend={(legend) => onLegend(groupKey, legend, groups)}
                  timeRange={timeRange}
                  onSelectTimeRange={onSelectTimeRange}
                  legendSelected$={legendSelected$}
                  highlightedLegendTarget$={highlightedLegendTarget$}
                />
              )}
            />
          </div>
          {isLegendAfter && renderLegend()}
        </div>
      );
    }
    // splitField references non-existent column: fall through to ungrouped single-chart render
  }

  const hasSelectionMapping = Object.keys(visConfig?.axesMapping ?? {}).length !== 0;
  if (hasSelectionMapping) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: isHorizontalLayout ? 'row' : 'column',
          height: '100%',
        }}
      >
        {!isLegendAfter && renderLegend()}
        <div style={{ flex: 1, minHeight: 0, minWidth: 0 }}>
          <ChartRender
            data={visualizationData}
            config={visConfig}
            renderContext={{ crosshairGroup }}
            onLegend={(legend) => onLegend('__default__', legend, ['__default__'])}
            timeRange={timeRange}
            onSelectTimeRange={onSelectTimeRange}
            legendSelected$={legendSelected$}
            highlightedLegendTarget$={highlightedLegendTarget$}
          />
        </div>
        {isLegendAfter && renderLegend()}
      </div>
    );
  }

  return <VisualizationEmptyState />;
};

export const VisualizationRender = ({
  data$,
  config$,
  showRawTable$,
  timeRange: inputTimeRange,
  onSelectTimeRange,
  onStyleChange,
  crosshairGroup,
}: Props) => {
  const visualizationData = useObservable(data$);
  const visConfig = useObservable(config$);
  const showRawTable = useObservable(showRawTable$);
  return (
    <CommonVisualizationRender
      visConfig={visConfig}
      visualizationData={visualizationData}
      showRawTable={!!showRawTable}
      timeRange={inputTimeRange}
      onSelectTimeRange={onSelectTimeRange}
      onStyleChange={onStyleChange}
      crosshairGroup={crosshairGroup}
    />
  );
};

const ChartRender = ({
  data,
  dataFilter,
  config,
  renderContext,
  onLegend,
  timeRange,
  onSelectTimeRange,
  legendSelected$,
  highlightedLegendTarget$,
}: {
  data?: VisData;
  dataFilter?: (data: Array<Record<string, any>>) => Array<Record<string, any>>;
  config?: RenderChartConfig;
  renderContext?: VisualizationRenderContext;
  onLegend?: (legendItems: LegendItem[]) => void;
  timeRange: TimeRange;
  onSelectTimeRange?: (timeRange?: TimeRange) => void;
  legendSelected$?: BehaviorSubject<Record<string, boolean>>;
  highlightedLegendTarget$?: BehaviorSubject<LegendTarget | undefined>;
}) => {
  if (!data) {
    return null;
  }

  if (!config?.type) {
    return null;
  }

  const columns = [
    ...(data.numericalColumns ?? []),
    ...(data.categoricalColumns ?? []),
    ...(data.dateColumns ?? []),
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
  const axisColumnMappings = convertStringsToMappings(config.axesMapping ?? {}, columns);
  const allAxisConfig = getAxisConfigByColumnMapping(axisColumnMappings, standardAxes);
  const styles = { ...config.styles, standardAxes: allAxisConfig };
  const visibleData = dataFilter ? dataFilter(data.transformedData) : data.transformedData;

  return rule.render({
    data: visibleData,
    allData: data.transformedData,
    styleOptions: styles,
    axisColumnMappings,
    timeRange,
    renderContext,
    onSelectTimeRange,
    onLegend,
    legendSelected$,
    highlightedLegendTarget$,
    seriesDisplayNames: data.seriesDisplayNames,
  });
};
