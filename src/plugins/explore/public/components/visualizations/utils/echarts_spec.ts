/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BarSeriesOption,
  LineSeriesOption,
  CustomSeriesOption,
  GaugeSeriesOption,
  EChartsOption,
  XAXisComponentOption,
  YAXisComponentOption,
  PieSeriesOption,
  ScatterSeriesOption,
  HeatmapSeriesOption,
} from 'echarts';
import {
  AggregationType,
  Positions,
  StandardAxes,
  TimeUnit,
  VisFieldType,
  Threshold,
  ThresholdOptions,
  AxisRole,
  VisColumn,
} from '../types';
import { convertThresholds } from './utils';
import { DEFAULT_OPACITY } from '../constants';
import { ColorMap } from './color_map';
import { getColors } from '../theme/default_colors';

/**
 * Base style interface that all chart styles should extend
 */
export interface BaseChartStyle {
  tooltipOptions?: {
    mode: string;
  };
  bucket?: {
    aggregationType?: AggregationType;
    bucketTimeUnit?: TimeUnit;
  };
  standardAxes?: StandardAxes[];
  thresholdOptions?: ThresholdOptions;
  useThresholdColor?: boolean;
  addLegend?: boolean;
  legendPosition?: Positions;
  showFullTimeRange?: boolean;
}

interface Axis {
  name: string;
  schema: VisFieldType;
  column: string;
}

/**
 * Configuration for ECharts axes (after swapping)
 */
interface EChartsAxisConfig {
  xAxisStyle?: StandardAxes;
  yAxisStyle?: StandardAxes;
  y2AxisStyle?: StandardAxes;
}

/**
 * Input for ECharts spec pipeline
 */
interface EChartsSpecInput<T extends BaseChartStyle = BaseChartStyle> {
  data: Array<Record<string, any>>;
  styles: T;
  axisConfig?: EChartsAxisConfig;
  axisColumnMappings: { [K in AxisRole]?: VisColumn | VisColumn[] };
  timeRange?: { from: string; to: string };
}

/**
 * State object that flows through the pipeline
 */
export interface EChartsSpecState<T extends BaseChartStyle = BaseChartStyle>
  extends EChartsSpecInput<T> {
  // Built incrementally
  // TODO: avoid any
  transformedData?: any[];
  baseConfig?: Pick<EChartsOption, 'tooltip' | 'legend'>;
  xAxisConfig?: any;
  yAxisConfig?: any;
  series?: Array<
    | BarSeriesOption
    | LineSeriesOption
    | CustomSeriesOption
    | PieSeriesOption
    | GaugeSeriesOption
    | ScatterSeriesOption
    | HeatmapSeriesOption
  >;
  visualMap?: EChartsOption['visualMap'];
  // Final output
  spec?: EChartsOption;
}

/**
 * Pipeline function signature
 */
export type PipelineFn<T extends BaseChartStyle = BaseChartStyle> = (
  state: EChartsSpecState<T>
) => EChartsSpecState<T>;

/**
 * Compose functions left-to-right (pipeline)
 */
export function pipe<T extends BaseChartStyle>(
  ...fns: Array<PipelineFn<T>>
): (state: EChartsSpecState<T>) => EChartsSpecState<T> {
  return (initialState: EChartsSpecState<T>) => fns.reduce((state, fn) => fn(state), initialState);
}

/**
 * Get ECharts axis type from VisColumn schema
 */
export function getAxisType(axis: Axis | Axis[] | undefined): 'category' | 'value' | 'time' {
  const effectiveAxis = Array.isArray(axis) ? axis[0] : axis;
  if (!effectiveAxis) return 'value';

  switch (effectiveAxis.schema) {
    case VisFieldType.Categorical:
      return 'category';
    case VisFieldType.Date:
      return 'time';
    case VisFieldType.Numerical:
    default:
      return 'value';
  }
}

/**
 * Create base configuration (tooltip)
 */
export const createBaseConfig = <T extends BaseChartStyle>({
  addTrigger = true,
  legend,
}: {
  addTrigger?: boolean;
  legend?: EChartsOption['legend'];
} = {}) => (state: EChartsSpecState<T>): EChartsSpecState<T> => {
  const { styles, axisConfig } = state;

  const baseConfig = {
    tooltip: {
      extraCssText: `overflow: auto; max-height: 50%; max-width: 80%;`,
      enterable: true, // for y direction overflow
      confine: true, // for x direction
      show: styles.tooltipOptions?.mode !== 'hidden',
      ...(axisConfig && addTrigger && { trigger: 'axis' as const }),
      axisPointer: { type: 'shadow' as const },
    },
    legend: {
      show: false,
      type: 'scroll',
      ...legend,
      ...(styles?.legendPosition === Positions.LEFT || styles?.legendPosition === Positions.RIGHT
        ? { orient: 'vertical' as const }
        : {}),
      [String(styles?.legendPosition ?? Positions.BOTTOM)]: 10, // distance between legend and the corresponding orientation edge side of the container
    },
  };

  return { ...state, baseConfig };
};

/**
 * Build axis configurations
 */
export const buildAxisConfigs = <T extends BaseChartStyle>(
  state: EChartsSpecState<T>
): EChartsSpecState<T> => {
  const { axisConfig, axisColumnMappings } = state;

  const hasY2 = axisColumnMappings.y2 !== undefined;

  const getConfig = (
    axis: Axis | Axis[] | undefined,
    axisStyle: StandardAxes | undefined,
    addSplitLineStyle: boolean = false
  ) => {
    return {
      type: getAxisType(axis),
      ...applyAxisStyling({ axisStyle, addSplitLineStyle }),
      nameGap: 8,
    };
  };

  if (!axisConfig) {
    throw new Error('axisConfig must be derived before buildAxisConfigs');
  }

  const xAxisConfig = getConfig(axisColumnMappings.x, axisConfig.xAxisStyle);
  let yAxisConfig: any = getConfig(axisColumnMappings.y, axisConfig.yAxisStyle);

  if (hasY2) {
    const y2AxisConfig = getConfig(axisColumnMappings.y2, axisConfig.y2AxisStyle, true);
    yAxisConfig = [yAxisConfig, y2AxisConfig];
  }

  return { ...state, xAxisConfig, yAxisConfig };
};

/**
 * Assemble final specification
 */
export const assembleSpec = <T extends BaseChartStyle>(
  state: EChartsSpecState<T>
): EChartsSpecState<T> => {
  const { baseConfig, transformedData = [], xAxisConfig, yAxisConfig, series, visualMap } = state;

  const hasMultiDatasets = Array.isArray(transformedData[0]?.[0]);

  // Multi-datasets case (e.g. state-timeline)
  const data = hasMultiDatasets
    ? transformedData.map((ds: any) => ({ source: ds }))
    : { source: transformedData };

  const spec = {
    ...baseConfig,
    dataset: data,
    xAxis: xAxisConfig,
    yAxis: yAxisConfig,
    visualMap,
    series,
  };

  return { ...state, spec };
};

const POSITION_MAP = {
  [Positions.LEFT]: 'left' as const,
  [Positions.RIGHT]: 'right' as const,
  [Positions.BOTTOM]: 'bottom' as const,
  [Positions.TOP]: 'top' as const,
};

export const applyAxisStyling = ({
  axisStyle,
  addSplitLineStyle,
}: {
  axisStyle?: StandardAxes;
  addSplitLineStyle?: boolean;
}): XAXisComponentOption | YAXisComponentOption => {
  const echartsAxisConfig: XAXisComponentOption | YAXisComponentOption = {
    name: axisStyle?.title?.text || '',
    nameLocation: 'middle',
    nameGap: 35,
    axisLine: { show: true },
  };

  // Apply axis visibility
  if (axisStyle && !axisStyle.show) {
    echartsAxisConfig.show = false;
    return echartsAxisConfig;
  }

  // Apply grid lines
  if (axisStyle?.grid) {
    echartsAxisConfig.splitLine = {
      show: axisStyle.grid.showLines ?? true,
      ...(addSplitLineStyle && {
        lineStyle: {
          type: 'dotted',
          opacity: DEFAULT_OPACITY / 2,
        },
      }),
    };
  }

  // Apply label settings
  if (axisStyle?.labels) {
    echartsAxisConfig.axisLabel = {
      show: !!axisStyle.labels.show,
      interval: 0,
      hideOverlap: true,
    };

    if (axisStyle.labels.show) {
      // Apply label rotation
      if (axisStyle.labels.rotate !== undefined) {
        echartsAxisConfig.axisLabel.rotate = axisStyle.labels.rotate;
      }

      // Apply label truncation
      if (axisStyle.labels.truncate !== undefined && axisStyle.labels.truncate > 0) {
        echartsAxisConfig.axisLabel.width = axisStyle.labels.truncate;
        echartsAxisConfig.axisLabel.overflow = 'truncate';
        echartsAxisConfig.axisLabel.ellipsis = '...';
      }
    }
  }

  // Apply position
  if (axisStyle?.position) {
    echartsAxisConfig.position = POSITION_MAP[axisStyle.position];
  }

  return echartsAxisConfig;
};

export const buildVisMap = ({
  seriesFields,
}: {
  seriesFields: (headers?: string[]) => string[];
}) => (state: EChartsSpecState) => {
  const { styles, transformedData = [] } = state;

  if (!styles.useThresholdColor) return state;

  const completeThreshold =
    styles.thresholdOptions && styles?.thresholdOptions.thresholds
      ? [
          { value: 0, color: styles.thresholdOptions.baseColor } as Threshold,
          ...styles.thresholdOptions.thresholds,
        ]
      : [];

  const convertedThresholds = convertThresholds(completeThreshold);
  const pieces = convertedThresholds.map((t) => ({
    gte: t.min,
    lt: t.max,
    color: t.color,
  }));

  const visualMap = seriesFields(transformedData[0]).map((c: string, index: number) => {
    const originalIndex = transformedData[0]?.indexOf(c);
    return {
      type: 'piecewise',
      show: false,
      seriesIndex: index,
      dimension: originalIndex,
      pieces,
    };
  });

  return {
    ...state,
    visualMap,
  };
};

/**
 * Apply time range to axis if showFullTimeRange is enabled
 */
export const applyTimeRange = <T extends BaseChartStyle>(
  state: EChartsSpecState<T>
): EChartsSpecState<T> => {
  const { styles, axisColumnMappings, timeRange, xAxisConfig, yAxisConfig } = state;

  if (!styles.showFullTimeRange || !timeRange?.from || !timeRange?.to) {
    return state;
  }

  const timeAxisEntry = Object.entries(axisColumnMappings).find(
    ([, axis]) => getAxisType(axis) === 'time'
  );

  if (!timeAxisEntry) {
    return state;
  }

  const [axisRole] = timeAxisEntry as [AxisRole, any];

  // Process time values
  const processTimeValue = (iso: string) => {
    const date = new Date(iso);
    return isNaN(date.getTime()) ? iso : date;
  };

  const minTime = processTimeValue(timeRange.from);
  const maxTime = processTimeValue(timeRange.to);

  let updatedXAxisConfig = xAxisConfig;
  let updatedYAxisConfig = yAxisConfig;

  if (axisRole === AxisRole.X) {
    if (Array.isArray(xAxisConfig)) {
      updatedXAxisConfig = xAxisConfig.map((config) => ({
        ...config,
        min: minTime,
        max: maxTime,
      }));
    } else if (xAxisConfig) {
      updatedXAxisConfig = {
        ...xAxisConfig,
        min: minTime,
        max: maxTime,
      };
    }
  } else if (axisRole === AxisRole.Y) {
    if (Array.isArray(yAxisConfig)) {
      updatedYAxisConfig = yAxisConfig.map((config) => ({
        ...config,
        min: minTime,
        max: maxTime,
      }));
    } else if (yAxisConfig) {
      updatedYAxisConfig = {
        ...yAxisConfig,
        min: minTime,
        max: maxTime,
      };
    }
  }

  return {
    ...state,
    xAxisConfig: updatedXAxisConfig,
    yAxisConfig: updatedYAxisConfig,
  };
};

/**
 * Collect legend data from series and notify via callback.
 * Read-only: does not assign colors. Each series builder must set itemStyle.color explicitly.
 * For scatter unfilled mode (color: 'transparent'), uses borderColor instead.
 */
export const collectLegend = <T extends BaseChartStyle>(
  onLegend?: (legend: ColorMap) => void
): PipelineFn<T> => (state) => {
  const { series } = state;
  if (!series || !onLegend) return state;

  const legend: ColorMap = {};
  series.forEach((s) => {
    const name = typeof s.name === 'string' ? s.name : undefined;
    if (!name) return;
    const itemStyle = 'itemStyle' in s ? s.itemStyle : undefined;
    const color = itemStyle?.color;
    const legendColor = !color || color === 'transparent' ? itemStyle?.borderColor : color;
    if (legendColor && typeof legendColor === 'string') {
      legend[name] = legendColor;
    }
  });

  onLegend(legend);

  return state;
};

/**
 * Collect legend data for pie charts from the series data items.
 * Pie assigns colors per data item (not per series), so we read from series[0].data.
 */
export const collectPieLegend = <T extends BaseChartStyle>(
  onLegend?: (legend: ColorMap) => void
): PipelineFn<T> => (state) => {
  const { series } = state;
  if (!series || !onLegend) return state;

  const legend: ColorMap = {};
  const pieSeries = series[0] as any;
  if (pieSeries?.data) {
    pieSeries.data.forEach((item: any) => {
      if (item?.name && item?.itemStyle?.color) {
        legend[item.name] = item.itemStyle.color;
      }
    });
  }

  onLegend(legend);

  return state;
};
