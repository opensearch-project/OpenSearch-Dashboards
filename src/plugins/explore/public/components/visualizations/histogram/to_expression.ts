/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HistogramChartStyle } from './histogram_vis_config';
import { AxisColumnMappings, VEGASCHEMA, VisColumn, VisFieldType, AggregationType } from '../types';
import { applyAxisStyling, getSwappedAxisRole, getSchemaByAxis } from '../utils/utils';
import { createThresholdLayer } from '../style_panel/threshold/threshold_utils';
import { adjustBucketBins, buildThresholdColorEncoding } from '../bar/bar_chart_utils';

// Only set size and binSpacing in manual mode
const configureBarSizeAndSpacing = (barMark: any, styles: HistogramChartStyle) => {
  if (styles.barSizeMode === 'manual') {
    barMark.size = styles.barWidth ? styles.barWidth * 20 : 14;
    barMark.binSpacing = styles.barPadding ? styles.barPadding * 10 : 1;
  }
};

export const createNumericalHistogramChart = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  styles: HistogramChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
  // Check if we have the required columns
  if (numericalColumns.length < 2) {
    throw new Error('Histogram bar chart requires at least two numerical column');
  }

  const { xAxis, xAxisStyle, yAxis, yAxisStyle } = getSwappedAxisRole(styles, axisColumnMappings);

  const layers: any[] = [];

  // Configure bar mark
  const barMark: any = {
    type: 'bar',
    tooltip: styles.tooltipOptions?.mode !== 'hidden',
  };

  configureBarSizeAndSpacing(barMark, styles);

  // Add border if enabled
  if (styles.showBarBorder) {
    barMark.stroke = styles.barBorderColor || '#000000';
    barMark.strokeWidth = styles.barBorderWidth || 1;
  }

  const colorEncodingLayer = buildThresholdColorEncoding(yAxis, styles);

  const mainLayer = {
    mark: barMark,
    encoding: {
      x: {
        field: xAxis?.column,
        type: getSchemaByAxis(xAxis),
        bin: adjustBucketBins(styles?.bucket, transformedData, xAxis?.column),
        axis: applyAxisStyling({ axis: xAxis, axisStyle: xAxisStyle }),
      },
      y: {
        field: yAxis?.column,
        aggregate: styles?.bucket?.aggregationType,
        type: getSchemaByAxis(yAxis),
        axis: applyAxisStyling({ axis: yAxis, axisStyle: yAxisStyle }),
      },
      color: styles?.colorModeOption === 'useThresholdColor' ? colorEncodingLayer : [],
      ...(styles.tooltipOptions?.mode !== 'hidden' && {
        tooltip: [
          {
            field: xAxis?.column,
            type: getSchemaByAxis(xAxis),
            bin: adjustBucketBins(styles?.bucket, transformedData, xAxis?.column),
            title: xAxisStyle?.title?.text || xAxis?.name,
          },
          {
            field: yAxis?.column,
            type: getSchemaByAxis(yAxis),
            aggregate: styles?.bucket?.aggregationType,
            title: yAxisStyle?.title?.text || `${yAxis?.name}(${styles?.bucket?.aggregationType})`,
          },
        ],
      }),
    },
  };

  layers.push(mainLayer);

  const barEncodingDefault = yAxis?.schema === VisFieldType.Numerical ? 'y' : 'x';
  // Add threshold layer if enabled
  const thresholdLayer = createThresholdLayer(styles?.thresholdOptions, barEncodingDefault);
  if (thresholdLayer) {
    layers.push(...thresholdLayer.layer);
  }

  return {
    $schema: VEGASCHEMA,
    title: styles.titleOptions?.show
      ? styles.titleOptions?.titleName || `${xAxis?.name} with ${yAxis?.name}`
      : undefined,
    data: { values: transformedData },
    layer: layers,
  };
};

export const createSingleHistogramChart = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  styles: HistogramChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
  // Check if we have the required columns
  if (numericalColumns.length < 1) {
    throw new Error('Histogram bar chart requires at least one numerical column');
  }

  const { xAxis, xAxisStyle, yAxis, yAxisStyle } = getSwappedAxisRole(styles, axisColumnMappings);

  const layers: any[] = [];

  // Configure bar mark
  const barMark: any = {
    type: 'bar',
    tooltip: styles.tooltipOptions?.mode !== 'hidden',
  };

  const colorEncodingLayer = buildThresholdColorEncoding(undefined, styles);

  configureBarSizeAndSpacing(barMark, styles);

  // Add border if enabled
  if (styles.showBarBorder) {
    barMark.stroke = styles.barBorderColor || '#000000';
    barMark.strokeWidth = styles.barBorderWidth || 1;
  }

  const mainLayer = {
    mark: barMark,
    encoding: {
      x: {
        field: xAxis?.column,
        type: getSchemaByAxis(xAxis),
        bin: adjustBucketBins(styles?.bucket, transformedData, xAxis?.column),
        axis: applyAxisStyling({ axis: xAxis, axisStyle: xAxisStyle }),
      },
      y: {
        aggregate: AggregationType.COUNT,
        type: 'quantitative',
        axis: applyAxisStyling({ axis: yAxis, axisStyle: yAxisStyle }),
      },
      color: styles?.colorModeOption === 'useThresholdColor' ? colorEncodingLayer : [],
      ...(styles.tooltipOptions?.mode !== 'hidden' && {
        tooltip: [
          {
            field: xAxis?.column,
            type: getSchemaByAxis(xAxis),
            bin: adjustBucketBins(styles?.bucket, transformedData, xAxis?.column),
            title: xAxisStyle?.title?.text || xAxis?.name,
          },
          {
            aggregate: AggregationType.COUNT,
            title: yAxisStyle?.title?.text || yAxis?.name,
          },
        ],
      }),
    },
  };

  layers.push(mainLayer);

  // Add threshold layer if enabled
  const thresholdLayer = createThresholdLayer(styles?.thresholdOptions, 'y');
  if (thresholdLayer) {
    layers.push(...thresholdLayer.layer);
  }

  return {
    $schema: VEGASCHEMA,
    title: styles.titleOptions?.show
      ? styles.titleOptions?.titleName || `Record counts of ${xAxis?.name}`
      : undefined,
    data: { values: transformedData },
    layer: layers,
  };
};
