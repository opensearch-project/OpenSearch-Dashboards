/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AggregationType,
  AxisColumnMappings,
  AxisRole,
  Positions,
  StandardAxes,
  VisColumn,
  VisFieldType,
} from '../types';
import { aggregate } from './data_transformation';

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
  };
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
 * Configuration for ECharts series
 */
export interface EChartsSeriesConfig {
  type: 'bar' | 'line' | 'scatter' | 'pie';
  name?: string;
  [key: string]: any;
}

/**
 * Options for building ECharts specification
 */
export interface EChartsBuildOptions<T extends BaseChartStyle = BaseChartStyle> {
  data: Array<Record<string, any>>;
  axisConfig: EChartsAxisConfig;
  seriesConfig: EChartsSeriesConfig | EChartsSeriesConfig[];
  styles: T;
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
 * Build a complete ECharts specification
 */
export function buildEChartsSpec<T extends BaseChartStyle>(options: EChartsBuildOptions<T>): any {
  const { data, axisConfig, seriesConfig, styles } = options;
  const { xAxis, yAxis, xAxisStyle, yAxisStyle } = axisConfig;

  // Get aggregation type from styles
  const aggregationType = styles.bucket?.aggregationType || AggregationType.SUM;

  const categoricalColumn = [xAxis, yAxis].find(
    (axis) => axis?.schema === VisFieldType.Categorical
  );
  const numericalColumn = [xAxis, yAxis].find((axis) => axis?.schema === VisFieldType.Numerical);

  // Aggregate data
  const aggregatedData = aggregate(
    data,
    categoricalColumn?.column || '',
    numericalColumn?.column || '',
    aggregationType
  );

  // Build axis configs - type derived from schema
  const xAxisConfig = {
    type: getAxisType(xAxis),
    ...applyAxisStyling({ axisStyle: xAxisStyle }),
  };

  const yAxisConfig = {
    type: getAxisType(yAxis),
    ...applyAxisStyling({ axisStyle: yAxisStyle }),
  };

  // Build base config
  const baseConfig = buildBaseConfig(styles, xAxis, yAxis);

  // Build series (support single or multiple)
  const series = Array.isArray(seriesConfig) ? seriesConfig : [seriesConfig];

  return {
    ...baseConfig,
    dataset: { source: aggregatedData },
    xAxis: xAxisConfig,
    yAxis: yAxisConfig,
    series,
  };
}

/**
 * Build common base configuration (title, tooltip, etc)
 */
function buildBaseConfig(
  styles: BaseChartStyle,
  xAxis: VisColumn | undefined,
  yAxis: VisColumn | undefined
): any {
  return {
    title: {
      text: styles.titleOptions?.show
        ? styles.titleOptions?.titleName || `${yAxis?.name} by ${xAxis?.name}`
        : undefined,
    },
    tooltip: {
      show: styles.tooltipOptions?.mode !== 'hidden',
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
  };
}

/**
 * Build bar series configuration
 */
export function buildBarSeries(name: string, styles: any): EChartsSeriesConfig {
  return {
    type: 'bar',
    name,
    barWidth: styles.barSizeMode === 'manual' ? `${(styles.barWidth || 0.7) * 100}%` : undefined,
    barCategoryGap:
      styles.barSizeMode === 'manual' ? `${(styles.barPadding || 0.1) * 100}%` : undefined,
  };
}

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
