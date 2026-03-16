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
  AxisColumnMappings,
  Positions,
  StandardAxes,
  TimeUnit,
  VisFieldType,
  Threshold,
  ThresholdOptions,
  AxisRole,
} from '../types';
import { convertThresholds } from './utils';
import { DEFAULT_OPACITY } from '../constants';

/**
 * Base style interface that all chart styles should extend
 */
export interface BaseChartStyle {
  titleOptions?: {
    show: boolean;
    titleName?: string;
  };
  tooltipOptions?: {
    mode: string;
  };
  bucket?: {
    aggregationType?: AggregationType;
    bucketTimeUnit?: TimeUnit;
  };
  switchAxes?: boolean;
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
export interface EChartsAxisConfig {
  xAxis?: Axis;
  yAxis?: Axis;
  xAxisStyle?: StandardAxes;
  yAxisStyle?: StandardAxes;
  y2Axis?: Axis;
  y2AxisStyle?: StandardAxes;
}

/**
 * Input for ECharts spec pipeline
 */
export interface EChartsSpecInput<T extends BaseChartStyle = BaseChartStyle> {
  data: Array<Record<string, any>>;
  styles: T;
  axisConfig?: EChartsAxisConfig;
  axisColumnMappings: AxisColumnMappings;
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
  baseConfig?: Pick<EChartsOption, 'title' | 'tooltip' | 'legend'>;
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
export function getAxisType(axis: Axis | undefined): 'category' | 'value' | 'time' {
  if (!axis) return 'value';

  switch (axis.schema) {
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
 * Create base configuration (title, tooltip)
 */
export const createBaseConfig = <T extends BaseChartStyle>({
  title,
  addTrigger = true,
  legend,
}: {
  title?: string;
  addTrigger?: boolean;
  legend?: EChartsOption['legend'];
}) => (state: EChartsSpecState<T>): EChartsSpecState<T> => {
  const { styles, axisConfig } = state;

  const baseConfig = {
    title: {
      text: styles.titleOptions?.show ? styles.titleOptions?.titleName || title : undefined,
    },
    tooltip: {
      extraCssText: `overflow-y: auto; max-height: 50%;`,
      enterable: true, // for y direction overflow
      confine: true, // for x direction
      show: styles.tooltipOptions?.mode !== 'hidden',
      ...(axisConfig && addTrigger && { trigger: 'axis' as const }),
      axisPointer: { type: 'shadow' as const },
    },
    legend: {
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
  const { axisConfig, transformedData = [], axisColumnMappings } = state;

  const hasFacet = Array.isArray(transformedData[0]?.[0]) && axisColumnMappings.facet !== undefined;
  const hasY2 = axisColumnMappings.y2 !== undefined && axisConfig?.y2Axis;

  const getConfig = (
    axis: Axis | undefined,
    axisStyle: StandardAxes | undefined,
    gridNumber?: number,
    addSplitLineStyle: boolean = false
  ) => {
    return {
      type: getAxisType(axis),
      ...applyAxisStyling({ axisStyle, addSplitLineStyle }),
      ...(hasFacet && { gridIndex: gridNumber }),
    };
  };

  if (!axisConfig) {
    throw new Error('axisConfig must be derived before buildAxisConfigs');
  }

  let xAxisConfig;
  let yAxisConfig;

  if (hasFacet) {
    // each grids needs an axis config
    xAxisConfig = transformedData.map((_: any, index: number) => {
      return getConfig(axisConfig.xAxis, axisConfig.xAxisStyle, index);
    });

    yAxisConfig = transformedData.map((_: any, index: number) => {
      return getConfig(axisConfig.yAxis, axisConfig.yAxisStyle, index);
    });
  } else {
    xAxisConfig = getConfig(axisConfig.xAxis, axisConfig.xAxisStyle);

    yAxisConfig = getConfig(axisConfig.yAxis, axisConfig.yAxisStyle);

    if (hasY2) {
      const y2AxisConfig = getConfig(axisConfig.y2Axis, axisConfig.y2AxisStyle, undefined, true);
      yAxisConfig = [yAxisConfig, y2AxisConfig];
    }
  }

  return { ...state, xAxisConfig, yAxisConfig };
};

/**
 * Assemble final specification
 */
export const assembleSpec = <T extends BaseChartStyle>(
  state: EChartsSpecState<T>
): EChartsSpecState<T> => {
  const {
    baseConfig,
    transformedData = [],
    xAxisConfig,
    yAxisConfig,
    series,
    visualMap,
    axisColumnMappings,
  } = state;

  const hasMultiDatasets = Array.isArray(transformedData[0]?.[0]);
  const hasFacet = hasMultiDatasets && axisColumnMappings.facet !== undefined;

  // Multi-datasets case (faceted or state-timeline)
  const data = hasMultiDatasets
    ? transformedData.map((facetData: any) => ({ source: facetData }))
    : { source: transformedData };

  const facetNumber = transformedData.length;

  let grid;

  if (hasFacet && facetNumber > 1) {
    const cols = Math.ceil(facetNumber / 2); // always in two rows
    const colWidth = 90 / cols;
    const rowHeight = 39; // slightly smaller to make legend fit

    grid = Array.from({ length: facetNumber }).map((_, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      return {
        left: `${5 + col * colWidth}%`,
        width: `${colWidth - 2}%`,
        top: `${5 + row * (rowHeight + 10)}%`,
        height: `${rowHeight}%`,
        containLabel: true,
      };
    });
  }

  const spec = {
    ...baseConfig,
    dataset: data,
    xAxis: xAxisConfig,
    yAxis: yAxisConfig,
    visualMap,
    series,
    grid,
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
      // Prevent label overlap by showing all labels
      interval: 0,
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

  const hasFacet = Array.isArray(transformedData[0]?.[0]);

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

  let visualMap;
  if (hasFacet) {
    let seriesIndexCounter = 0;
    const facetVis = transformedData.map((seriesData: any[], index: number) => {
      const header = seriesData[0];
      const cateColumns = seriesFields(header);
      return cateColumns.map((c: string) => {
        const originalIndex = header?.indexOf(c);
        return {
          datasetIndex: index,
          gridIndex: index,
          type: 'piecewise',
          show: false,
          seriesIndex: seriesIndexCounter++,
          dimension: originalIndex,
          pieces,
        };
      });
    });

    visualMap = facetVis.flat();
  } else {
    visualMap = seriesFields(transformedData[0]).map((c: string, index: number) => {
      const originalIndex = transformedData[0]?.indexOf(c);
      return {
        type: 'piecewise',
        show: false,
        seriesIndex: index,
        dimension: originalIndex,
        pieces,
      };
    });
  }

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
    ([, col]) => col?.schema === VisFieldType.Date
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
