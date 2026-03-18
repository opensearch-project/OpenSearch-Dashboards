/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HistogramChartStyle } from './histogram_vis_config';
import { AxisColumnMappings, VisColumn, VisFieldType } from '../types';
import { getSwappedAxisRole } from '../utils/utils';
import { assembleSpec, buildAxisConfigs, createBaseConfig, pipe } from '../utils/echarts_spec';
import { convertTo2DArray, transform } from '../utils/data_transformation';
import { bin } from '../utils/data_transformation/bin';
import { createHistogramSeries } from './histogram_chart_utils';

export const createNumericalHistogramChart = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  styles: HistogramChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
  const axisConfig = getSwappedAxisRole(styles, axisColumnMappings);
  const { xAxis, yAxis } = axisConfig;
  if (!xAxis) {
    throw Error('Missing axis config for Histogram chart');
  }

  const categoryField = xAxis.column;
  const valueField = yAxis?.column;

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
    axisConfig: {
      ...axisConfig,
      xAxis: {
        name: 'bucket',
        column: 'bucket',
        schema: VisFieldType.Numerical,
      },
      yAxis: {
        name: 'value',
        column: 'value',
        schema: VisFieldType.Numerical,
      },
    },
    axisColumnMappings: axisColumnMappings ?? {},
  });
  return result.spec;
};

export const createSingleHistogramChart = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  styles: HistogramChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
  const axisConfig = getSwappedAxisRole(styles, axisColumnMappings);
  const { xAxis } = axisConfig;
  if (!xAxis) {
    throw Error('Missing axis config for Histogram chart');
  }

  const categoryField = xAxis.column;

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
    axisConfig: {
      ...axisConfig,
      xAxis: {
        name: 'bucket',
        column: 'bucket',
        schema: VisFieldType.Numerical,
      },
      yAxis: {
        name: 'value',
        column: 'value',
        schema: VisFieldType.Numerical,
      },
    },
    axisColumnMappings: axisColumnMappings ?? {},
  });
  return result.spec;
};
