/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Axis, BarSeriesOption, CustomSeriesOption } from 'echarts';
import { BarChartStyle } from '../bar/bar_vis_config';
import {
  AggregationType,
  AxisColumnMappings,
  Positions,
  StandardAxes,
  TimeUnit,
  VisColumn,
  VisFieldType,
} from '../types';
import { aggregate, aggregateByTime } from './data_transformation';
import { getSwappedAxisRole, timeUnitToMs } from './utils';
import { inferTimeIntervals } from '../bar/bar_chart_utils';

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
  aggregatedData?: any[];
  baseConfig?: any;
  xAxisConfig?: any;
  yAxisConfig?: any;
  series?: Array<BarSeriesOption | CustomSeriesOption>;

  // Final output
  spec?: any;
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

  // Detect column types
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
    aggregatedData = aggregateByTime(
      data,
      dateColumn.column,
      numericalColumn.column,
      timeUnit,
      styles.bucket?.aggregationType || AggregationType.SUM
    );
  }
  // CATEGORICAL + NUMERICAL: Use existing aggregation
  else if (categoricalColumn && numericalColumn) {
    aggregatedData = aggregate(
      data,
      categoricalColumn.column,
      numericalColumn.column,
      styles.bucket?.aggregationType || AggregationType.SUM
    );
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
  const { axisConfig, aggregatedData, styles, data } = state;

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

  const dateAxis = [axisConfig.xAxis, axisConfig.yAxis].find(
    (axis) => axis?.schema === VisFieldType.Date
  );

  if (dateAxis && aggregatedData) {
    const timeUnit = styles.bucket?.bucketTimeUnit ?? TimeUnit.AUTO;
    const effectiveTimeUnit =
      timeUnit === TimeUnit.AUTO ? inferTimeIntervals(data, dateAxis.column) : timeUnit;

    // Get the last data point (skip header row at index 0)
    const lastDataPoint = aggregatedData[aggregatedData.length - 1];
    if (lastDataPoint && lastDataPoint[0] instanceof Date) {
      const lastDate = lastDataPoint[0];
      const lastTime = lastDate.getTime();

      // Calculate bar width based on the actual last date for accurate month/year durations
      const barWidthInMs = timeUnitToMs(effectiveTimeUnit, lastDate);
      const extendedMax = new Date(lastTime + barWidthInMs);

      if (xAxisConfig.type === 'time') {
        xAxisConfig.max = extendedMax;
      }
      if (yAxisConfig.type === 'time') {
        yAxisConfig.max = extendedMax;
      }
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
  const { baseConfig, aggregatedData, xAxisConfig, yAxisConfig, series } = state;

  const spec = {
    ...baseConfig,
    dataset: { source: aggregatedData },
    xAxis: xAxisConfig,
    yAxis: yAxisConfig,
    series,
  };

  return { ...state, spec };
};

export const applyAxisStyling = ({ axisStyle }: { axisStyle?: StandardAxes }): any => {
  const echartsAxisConfig: any = {
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
    const positionMap: Record<Positions, string> = {
      [Positions.LEFT]: 'left',
      [Positions.RIGHT]: 'right',
      [Positions.BOTTOM]: 'bottom',
      [Positions.TOP]: 'top',
    };
    echartsAxisConfig.position = positionMap[axisStyle.position];
  }

  return echartsAxisConfig;
};
