/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BarSeriesOption,
  LineSeriesOption,
  CustomSeriesOption,
  EChartsOption,
  XAXisComponentOption,
  YAXisComponentOption,
} from 'echarts';
import {
  AggregationType,
  AxisColumnMappings,
  Positions,
  StandardAxes,
  TimeUnit,
  VisColumn,
  VisFieldType,
  Threshold,
  ThresholdOptions,
} from '../types';
import { aggregate, aggregateByTime } from './data_transformation';
import { getSwappedAxisRole, convertThresholds } from './utils';

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
}

/**
 * Configuration for ECharts axes (after swapping)
 */
export interface EChartsAxisConfig {
  xAxis?: VisColumn;
  yAxis?: VisColumn;
  xAxisStyle?: StandardAxes;
  yAxisStyle?: StandardAxes;
}

/**
 * Input for ECharts spec pipeline
 */
export interface EChartsSpecInput<T extends BaseChartStyle = BaseChartStyle> {
  data: Array<Record<string, any>>;
  styles: T;
  axisColumnMappings?: AxisColumnMappings;
}

/**
 * State object that flows through the pipeline
 */
export interface EChartsSpecState<T extends BaseChartStyle = BaseChartStyle>
  extends EChartsSpecInput<T> {
  // Derived from input
  axisConfig?: EChartsAxisConfig;

  // Built incrementally
  // TODO: avoid any
  aggregatedData?: any;
  baseConfig?: any;
  xAxisConfig?: any;
  yAxisConfig?: any;
  series?: Array<BarSeriesOption | LineSeriesOption | CustomSeriesOption>;
  visualMap?: any;
  grid?: any;

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
function getAxisType(axis: VisColumn | undefined): 'category' | 'value' | 'time' {
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
 * Derive axis configuration from styles and mappings
 */
export const deriveAxisConfig = <T extends BaseChartStyle>(
  state: EChartsSpecState<T>
): EChartsSpecState<T> => {
  const { styles, axisColumnMappings } = state;
  const axisConfig = getSwappedAxisRole(styles, axisColumnMappings);

  return { ...state, axisConfig };
};

/**
 * Prepare and aggregate data
 */
export const prepareData = <T extends BaseChartStyle>(
  state: EChartsSpecState<T>
): EChartsSpecState<T> => {
  const { data, axisConfig, styles } = state;

  if (!axisConfig) {
    throw new Error('axisConfig must be derived before prepareData');
  }

  const dateColumn = [axisConfig.xAxis, axisConfig.yAxis].find(
    (axis) => axis?.schema === VisFieldType.Date
  );
  const categoricalColumn = [axisConfig.xAxis, axisConfig.yAxis].find(
    (axis) => axis?.schema === VisFieldType.Categorical
  );
  const numericalColumn = [axisConfig.xAxis, axisConfig.yAxis].find(
    (axis) => axis?.schema === VisFieldType.Numerical
  );

  let aggregatedData;

  // TIME + NUMERICAL: Use time-based aggregation
  if (dateColumn && numericalColumn) {
    const timeUnit = styles.bucket?.bucketTimeUnit ?? TimeUnit.AUTO;
    const result = aggregateByTime(
      data,
      dateColumn.column,
      numericalColumn.column,
      timeUnit,
      styles.bucket?.aggregationType || AggregationType.SUM
    );
    aggregatedData = result.aggregatedData;
  }
  // CATEGORICAL + NUMERICAL: Use existing aggregation
  else if (categoricalColumn && numericalColumn) {
    const result = aggregate(
      data,
      categoricalColumn.column,
      numericalColumn.column,
      styles.bucket?.aggregationType || AggregationType.SUM
    );
    aggregatedData = result.aggregatedData;
  }
  // Fallback: return data as-is
  else {
    aggregatedData = data;
  }

  return { ...state, aggregatedData };
};

/**
 * Create base configuration (title, tooltip)
 */
export const createBaseConfig = <T extends BaseChartStyle>(
  state: EChartsSpecState<T>
): EChartsSpecState<T> => {
  const { styles, axisConfig } = state;

  if (!axisConfig) {
    throw new Error('axisConfig must be derived before createBaseConfig');
  }

  const baseConfig = {
    title: {
      text: styles.titleOptions?.show
        ? styles.titleOptions?.titleName || `${axisConfig.yAxis?.name} by ${axisConfig.xAxis?.name}`
        : undefined,
    },
    tooltip: {
      show: styles.tooltipOptions?.mode !== 'hidden',
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
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
  const { axisConfig } = state;

  if (!axisConfig) {
    throw new Error('axisConfig must be derived before buildAxisConfigs');
  }

  const xAxisConfig = {
    type: getAxisType(axisConfig.xAxis),
    ...applyAxisStyling({ axisStyle: axisConfig.xAxisStyle }),
  };

  const yAxisConfig = {
    type: getAxisType(axisConfig.yAxis),
    ...applyAxisStyling({ axisStyle: axisConfig.yAxisStyle }),
  };

  return { ...state, xAxisConfig, yAxisConfig };
};

/**
 * Assemble final specification
 */
export const assembleSpec = <T extends BaseChartStyle>(
  state: EChartsSpecState<T>
): EChartsSpecState<T> => {
  const { baseConfig, aggregatedData, xAxisConfig, yAxisConfig, series, visualMap } = state;

  const spec = {
    ...baseConfig,
    dataset: { source: aggregatedData },
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
}: {
  axisStyle?: StandardAxes;
}): XAXisComponentOption | YAXisComponentOption => {
  const echartsAxisConfig: XAXisComponentOption | YAXisComponentOption = {
    name: axisStyle?.title?.text || '',
    nameLocation: 'middle',
    nameGap: 35,
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

export const buildVisMap = <T extends BaseChartStyle>(
  state: EChartsSpecState<T>
): EChartsSpecState<T> => {
  const { styles, aggregatedData, axisColumnMappings } = state;

  const actualX = axisColumnMappings?.x?.column;
  const cateColumns = aggregatedData?.[0]?.filter((c: string) => c !== actualX);

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

  if (axisColumnMappings?.color) {
    visualMap = cateColumns.map((c: string, index: number) => {
      const originalIndex = aggregatedData?.[0]?.indexOf(c);
      return {
        type: 'piecewise',
        show: false,
        seriesIndex: index,
        dimension: originalIndex,
        pieces,
      };
    });
  } else {
    visualMap = {
      type: 'piecewise',
      show: false,
      seriesIndex: 0,
      dimension: 1,
      pieces,
    };
  }

  return {
    ...state,
    visualMap,
  };
};
