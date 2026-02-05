/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HeatmapChartStyle } from './heatmap_vis_config';
// @ts-expect-error TS6133 TODO(ts-error): fixme
import { VisColumn, VEGASCHEMA, AxisColumnMappings, AggregationType, VisFieldType } from '../types';
import {
  applyAxisStyling,
  getSwappedAxisRole,
  getSchemaByAxis,
  getChartRender,
} from '../utils/utils';
import {
  createLabelLayer,
  enhanceStyle,
  addTransform,
  createHeatmapSeries,
} from './heatmap_chart_utils';

import {
  pipe,
  createBaseConfig,
  buildAxisConfigs,
  assembleSpec,
  buildVisMap,
} from '../utils/echarts_spec';
import { convertTo2DArray, aggregateByGroups, transform } from '../utils/data_transformation';

export const createHeatmapWithBin = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  styles: HeatmapChartStyle,
  axisColumnMappings?: AxisColumnMappings
) => {
  const { xAxis, xAxisStyle, yAxis, yAxisStyle } = getSwappedAxisRole(styles, axisColumnMappings);

  const colorFieldColumn = axisColumnMappings?.color as any;
  const colorField = colorFieldColumn?.column;
  const colorName = colorFieldColumn?.name;

  const markLayer: any = {
    mark: {
      type: 'rect',
      tooltip: styles?.tooltipOptions?.mode !== 'hidden',
      stroke: 'white',
      strokeWidth: 1,
    },
    encoding: {
      x: {
        field: xAxis?.column,
        type: getSchemaByAxis(xAxis),
        bin: true,
        axis: { ...applyAxisStyling({ axis: xAxis, axisStyle: xAxisStyle }), tickOpacity: 0 },
      },
      y: {
        field: yAxis?.column,
        type: getSchemaByAxis(yAxis),
        bin: true,
        axis: { ...applyAxisStyling({ axis: yAxis, axisStyle: yAxisStyle }), tickOpacity: 0 },
      },
      color: {
        field: colorField,
        type: getSchemaByAxis(colorFieldColumn),
        // TODO: a dedicate method to handle scale type is log especially in percentage mode
        bin: !styles?.useThresholdColor
          ? { maxbins: Number(styles.exclusive?.maxNumberOfColors) }
          : false,
        scale: {
          type: styles.exclusive?.colorScaleType,
          scheme: styles.exclusive?.colorSchema,
          reverse: styles.exclusive?.reverseSchema,
        },
        legend: styles.addLegend
          ? {
              title: styles.legendTitle,
              orient: styles.legendPosition,
            }
          : null,
      },
      ...(styles.tooltipOptions?.mode !== 'hidden' && {
        tooltip: [
          {
            field: xAxis?.column,
            type: getSchemaByAxis(xAxis),
            title: xAxisStyle?.title?.text || xAxis?.name,
          },
          {
            field: yAxis?.column,
            type: getSchemaByAxis(yAxis),
            title: yAxisStyle?.title?.text || yAxis?.name,
          },
          { field: colorField, type: 'quantitative', title: colorName },
        ],
      }),
    },
  };

  enhanceStyle(markLayer, styles, transformedData, colorField);

  const baseSpec = {
    $schema: VEGASCHEMA,
    data: { values: transformedData },
    transform: addTransform(styles, colorField),
    layer: [markLayer, createLabelLayer(styles, false, colorField, xAxis, yAxis)].filter(Boolean),
    title: styles.titleOptions?.show
      ? styles.titleOptions?.titleName || `${colorName} by ${xAxis?.name} and ${yAxis?.name}`
      : undefined,
  };
  return baseSpec;
};

export const createRegularHeatmap = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  styles: HeatmapChartStyle,
  axisColumnMappings?: AxisColumnMappings
) => {
  if (getChartRender() === 'echarts') {
    const axisConfig = getSwappedAxisRole(styles, axisColumnMappings);
    const xAxis = axisConfig.xAxis;
    const yAxis = axisConfig.yAxis;

    const valueField = axisColumnMappings?.color?.column;
    const valueName = axisColumnMappings?.color?.name;

    if (!xAxis || !yAxis || !valueField) {
      throw Error('Missing axis config for heatmap chart');
    }

    const result = pipe(
      transform(
        aggregateByGroups({
          groupBy: [xAxis.column, yAxis.column],
          field: valueField,
          aggregationType: AggregationType.SUM, // TODO use AggregationType.SUM temporarily and add aggregtaion choice in UI
        }),
        convertTo2DArray()
      ),
      createBaseConfig({
        title: `${valueName} by ${xAxis?.name} and ${yAxis?.name}`,
        addTrigger: false,
        legend: { show: styles.addLegend },
      }),
      buildAxisConfigs,
      buildVisMap({
        seriesFields: (headers) =>
          (headers ?? []).filter((h) => h !== yAxis.column && h !== xAxis.column),
      }),
      createHeatmapSeries({
        styles,
        categoryFields: [xAxis.column, yAxis.column],
        seriesField: valueField,
      }),
      assembleSpec
    )({
      data: transformedData,
      styles,
      axisConfig,
      axisColumnMappings: axisColumnMappings ?? {},
    });

    return result.spec;
  }

  const { xAxis, xAxisStyle, yAxis, yAxisStyle } = getSwappedAxisRole(styles, axisColumnMappings);

  const colorFieldColumn = axisColumnMappings?.color!;
  const colorField = colorFieldColumn?.column;
  const colorName = colorFieldColumn?.name;

  const markLayer: any = {
    mark: {
      type: 'rect',
      tooltip: styles?.tooltipOptions?.mode !== 'hidden',
      stroke: 'white',
      strokeWidth: 1,
    },
    encoding: {
      x: {
        field: xAxis?.column,
        type: getSchemaByAxis(xAxis),
        axis: {
          ...applyAxisStyling({ axis: xAxis, axisStyle: xAxisStyle, disableGrid: true }),
          tickOpacity: 0,
        },
        // for regular heatmap, both x and y refer to categorical fields, we shall disable grid line for this case
      },
      y: {
        field: yAxis?.column,
        type: getSchemaByAxis(yAxis),
        axis: {
          ...applyAxisStyling({ axis: yAxis, axisStyle: yAxisStyle, disableGrid: true }),
          tickOpacity: 0,
        },
      },
      color: {
        field: colorField,
        type: getSchemaByAxis(colorFieldColumn),
        // TODO: a dedicate method to handle scale type is log especially in percentage mode
        bin: !styles?.useThresholdColor
          ? { maxbins: Number(styles.exclusive?.maxNumberOfColors) }
          : false,
        scale: {
          type: styles.exclusive?.colorScaleType,
          scheme: styles.exclusive?.colorSchema,
          reverse: styles.exclusive?.reverseSchema,
        },
        legend: styles.addLegend
          ? {
              title: styles.legendTitle,
              orient: styles.legendPosition,
            }
          : null,
      },
      ...(styles.tooltipOptions?.mode !== 'hidden' && {
        tooltip: [
          {
            field: xAxis?.column,
            type: getSchemaByAxis(xAxis),
            title: xAxisStyle?.title?.text || xAxis?.name,
          },
          {
            field: yAxis?.column,
            type: getSchemaByAxis(yAxis),
            title: yAxisStyle?.title?.text || yAxis?.name,
          },
          { field: colorField, type: 'quantitative', title: colorName },
        ],
      }),
    },
  };

  enhanceStyle(markLayer, styles, transformedData, colorField);

  const baseSpec = {
    $schema: VEGASCHEMA,
    data: { values: transformedData },
    transform: addTransform(styles, colorField),
    layer: [markLayer, createLabelLayer(styles, true, colorField, xAxis, yAxis)].filter(Boolean),
    title: styles.titleOptions?.show
      ? styles.titleOptions?.titleName || `${colorName} by ${xAxis?.name} and ${yAxis?.name}`
      : undefined,
  };

  return baseSpec;
};
