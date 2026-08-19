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
  DataRange,
} from '../types';
import { computeDataRange, convertThresholds, resolveThresholds } from './utils';
import { DEFAULT_OPACITY } from '../constants';
import { LegendItem } from './legend';

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
export interface EChartsSpecState<
  T extends BaseChartStyle = BaseChartStyle,
> extends EChartsSpecInput<T> {
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
  legendItems?: LegendItem[];
  // Min/max of the value data
  dataRange?: DataRange;
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
 * compute the series data range(min, max)
 *
 * @param seriesFields the Y-value columns — an array, or a headers->fields fn
 *   (resolved here against the header row, same as the series builders do).
 * @param stacked whether the series are stacked
 * @param fromBase whether the series shall consider baseline
 */
export const buildDataRange =
  <T extends BaseChartStyle>({
    seriesFields,
    stacked = false,
    fromBase = false,
  }: {
    seriesFields: string[] | ((headers?: string[]) => string[]);
    stacked?: boolean;
    fromBase?: boolean;
  }): PipelineFn<T> =>
  (state) => {
    const data = state.transformedData;
    const header = Array.isArray(data) && Array.isArray(data[0]) ? data[0] : undefined;
    const fields = Array.isArray(seriesFields) ? seriesFields : seriesFields(header);

    const dataRange = computeDataRange(data, fields, stacked);

    if (dataRange && fromBase) {
      // Bar chart compute min base from baseline
      dataRange.min = Math.min(0, dataRange.min);
      if (dataRange.stackMin !== undefined) {
        dataRange.stackMin = Math.min(0, dataRange.stackMin);
      }
    }

    return { ...state, dataRange };
  };

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
export const createBaseConfig =
  <T extends BaseChartStyle>({
    addTrigger = true,
    legend,
  }: {
    addTrigger?: boolean;
    legend?: EChartsOption['legend'];
  } = {}) =>
  (state: EChartsSpecState<T>): EChartsSpecState<T> => {
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

export const buildThresholds = (styles: BaseChartStyle, dataRange?: DataRange) => {
  const completeThreshold =
    styles.thresholdOptions && styles?.thresholdOptions.thresholds
      ? [
          { value: 0, color: styles.thresholdOptions.baseColor } as Threshold,
          ...styles.thresholdOptions.thresholds,
        ]
      : [];

  const isPercentage = styles.thresholdOptions?.thresholdMode === 'percentage';

  // transform Percentage thresholds to absolute first, base threshold { value: 0 } becomes to the range floor
  const resolved = resolveThresholds(
    completeThreshold,
    styles.thresholdOptions?.thresholdMode,
    dataRange
  );

  const originalRanges = convertThresholds(completeThreshold);

  return (
    convertThresholds(resolved)
      .map((range, i) => ({ range, original: originalRanges[i] }))
      // Drop zero-range threshold
      // avoid showing 0%-0%
      .filter(({ original }) => original.min !== original.max)
      .map(({ range, original }) => ({
        gte: range.min,
        lt: range.max,
        color: range.color,
        ...{
          label:
            original.max === Infinity
              ? `≥ ${original.min}${isPercentage ? '%' : ''}`
              : `${original.min}${isPercentage ? '%' : ''} ~ ${original.max}${isPercentage ? '%' : ''}`,
        },
      }))
  );
};

export const buildVisMap =
  ({ seriesFields }: { seriesFields: (headers?: string[]) => string[] }) =>
  (state: EChartsSpecState) => {
    const { styles, transformedData = [], dataRange } = state;

    if (!styles.useThresholdColor) return state;

    const pieces = buildThresholds(styles, dataRange);

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
