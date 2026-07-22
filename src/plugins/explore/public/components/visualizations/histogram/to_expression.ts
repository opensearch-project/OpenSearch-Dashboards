/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HistogramChartStyle } from './histogram_vis_config';
import { AxisRole, VisColumn, VisFieldType } from '../types';
import { getAxisConfig } from '../utils/utils';
import { assembleSpec, buildAxisConfigs, createBaseConfig, pipe } from '../utils/echarts_spec';
import { convertTo2DArray, transform } from '../utils/data_transformation';
import { bin } from '../utils/data_transformation/bin';
import { createHistogramSeries } from './histogram_chart_utils';

export const createNumericalHistogramChart = (
  transformedData: Array<Record<string, any>>,
  styles: HistogramChartStyle,
  axisColumnMappings: { [AxisRole.X]: VisColumn; [AxisRole.Y]: VisColumn }
): any => {
  const axisConfig = getAxisConfig(styles);

  const categoryField = axisColumnMappings[AxisRole.X].column;
  const valueField = axisColumnMappings[AxisRole.Y].column;

  const result = pipe(
    transform(
      bin({
        bin: { size: styles.bucket.bucketSize, count: styles.bucket.bucketCount },
        binField: categoryField,
        valueField,
        aggregationType: styles.bucket.aggregationType,
      }),
      convertTo2DArray()
    ),
    createBaseConfig({ legend: { show: false } }),
    buildAxisConfigs,
    createHistogramSeries({
      styles,
      binStartField: 'start',
      binEndField: 'end',
      seriesFields: ['value'],
    }),
    assembleSpec
  )({
    data: transformedData,
    styles,
    axisConfig,
    axisColumnMappings,
  });
  return result.spec;
};

export const createSingleHistogramChart = (
  transformedData: Array<Record<string, any>>,
  styles: HistogramChartStyle,
  axisColumnMappings: { [AxisRole.X]: VisColumn }
): any => {
  const axisConfig = getAxisConfig(styles);

  const categoryField = axisColumnMappings[AxisRole.X].column;

  const result = pipe(
    transform(
      bin({
        bin: { size: styles.bucket.bucketSize, count: styles.bucket.bucketCount },
        binField: categoryField,
      }),
      convertTo2DArray()
    ),
    createBaseConfig({ legend: { show: false } }),
    buildAxisConfigs,
    createHistogramSeries({
      styles,
      binStartField: 'start',
      binEndField: 'end',
      seriesFields: ['value'],
    }),
    assembleSpec
  )({
    data: transformedData,
    styles,
    axisConfig,
    axisColumnMappings,
  });
  return result.spec;
};
