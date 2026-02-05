/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AxisColumnMappings,
  AxisRole,
  VEGASCHEMA,
  VisColumn,
  VisFieldType,
  TimeUnit,
  AggregationType,
} from '../types';
import { BarChartStyle, defaultBarChartStyles } from './bar_vis_config';
import { createThresholdLayer } from '../style_panel/threshold/threshold_utils';
import {
  applyAxisStyling,
  getSwappedAxisRole,
  getSchemaByAxis,
  applyTimeRangeToEncoding,
  getChartRender,
} from '../utils/utils';

import {
  inferTimeIntervals,
  buildEncoding,
  buildTooltipEncoding,
  buildThresholdColorEncoding,
  createBarSeries,
  createFacetBarSeries,
} from './bar_chart_utils';
import { DEFAULT_OPACITY } from '../constants';
import { createTimeRangeBrush, createTimeRangeUpdater } from '../utils/time_range_brush';
import {
  pipe,
  createBaseConfig,
  buildAxisConfigs,
  assembleSpec,
  buildVisMap,
  applyTimeRange,
} from '../utils/echarts_spec';
import {
  aggregate,
  convertTo2DArray,
  transform,
  pivot,
  facetTransform,
} from '../utils/data_transformation';

// Only set size and binSpacing in manual mode
const configureBarSizeAndSpacing = (barMark: any, styles: BarChartStyle) => {
  if (styles.barSizeMode === 'manual') {
    barMark.size = styles.barWidth ? styles.barWidth * 20 : 14;
    barMark.binSpacing = styles.barPadding ? styles.barPadding * 10 : 1;
  }
};

export const createBarSpec = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styleOptions: BarChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
  // if chart render is 'echarts', here it return the echarts config options
  if (getChartRender() === 'echarts') {
    const styles = { ...defaultBarChartStyles, ...styleOptions };
    const axisConfig = getSwappedAxisRole(styles, axisColumnMappings);
    const xAxis = axisConfig.xAxis;
    const yAxis = axisConfig.yAxis;

    if (!xAxis || !yAxis) {
      throw Error('Missing axis config for Bar chart');
    }

    let categoryField = '';
    let valueField = '';

    if (xAxis.schema === VisFieldType.Categorical) {
      categoryField = xAxis.column;
      valueField = yAxis.column;
    } else if (yAxis.schema === VisFieldType.Categorical) {
      categoryField = yAxis.column;
      valueField = xAxis.column;
    }

    const aggregationType = styles.bucket.aggregationType ?? AggregationType.SUM;
    const result = pipe(
      transform(
        aggregate({
          groupBy: categoryField,
          field: valueField,
          aggregationType,
        }),
        convertTo2DArray()
      ),
      createBaseConfig({ title: `${yAxis?.name} by ${xAxis?.name}`, legend: { show: false } }),
      buildAxisConfigs,
      buildVisMap({
        seriesFields: (headers) => (headers ?? []).filter((h) => h !== categoryField),
      }),
      createBarSeries({ kind: 'bar', styles, categoryField, seriesFields: [valueField] }),
      assembleSpec
    )({
      data: transformedData,
      styles,
      axisConfig,
      axisColumnMappings: axisColumnMappings ?? {},
    });
    return result.spec;
  }

  const styles = { ...defaultBarChartStyles, ...styleOptions };
  const { xAxis, xAxisStyle, yAxis, yAxisStyle } = getSwappedAxisRole(styles, axisColumnMappings);

  const layers: any[] = [];

  // Set up encoding
  const categoryAxis = 'x';
  const valueAxis = 'y';

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

  const numericalAxis = yAxis?.schema === VisFieldType.Numerical ? yAxis : xAxis;

  const colorEncodingLayer = buildThresholdColorEncoding(numericalAxis, styleOptions);

  const mainLayer = {
    params: [{ name: 'highlight', select: { type: 'point', on: 'pointerover' } }],
    mark: barMark,
    encoding: {
      // Category axis (X or Y depending on orientation)
      [categoryAxis]: {
        ...buildEncoding(xAxis, xAxisStyle, undefined, styles?.bucket?.aggregationType),
      },
      // Value axis (Y or X depending on orientation)
      [valueAxis]: {
        ...buildEncoding(yAxis, yAxisStyle, undefined, styles?.bucket?.aggregationType),
      },
      color: styleOptions?.useThresholdColor ? colorEncodingLayer : [],
      ...(styles.tooltipOptions?.mode !== 'hidden' && {
        tooltip: [
          {
            ...buildTooltipEncoding(xAxis, xAxisStyle, undefined, styles?.bucket?.aggregationType),
          },
          {
            ...buildTooltipEncoding(yAxis, yAxisStyle, undefined, styles?.bucket?.aggregationType),
          },
        ],
      }),
      fillOpacity: {
        condition: { param: 'highlight', value: 1, empty: false },
        value: DEFAULT_OPACITY,
      },
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
      ? styles.titleOptions?.titleName || `${yAxis?.name} by ${xAxis?.name}`
      : undefined,
    data: { values: transformedData },
    layer: layers,
  };
};

/**
 * Create a time-based bar chart with one metric and one date
 * @param transformedData The transformed data
 * @param numericalColumns The numerical columns
 * @param dateColumns The date columns
 * @param styles The style options
 * @returns The Vega spec for a time-based bar chart
 */
export const createTimeBarChart = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: BarChartStyle,
  axisColumnMappings?: AxisColumnMappings,
  timeRange?: { from: string; to: string }
): any => {
  // Check if we have the required columns
  if (numericalColumns.length === 0 || dateColumns.length === 0) {
    throw new Error('Time bar chart requires at least one numerical column and one date column');
  }

  // TODO: support styles.showFullTimeRange
  // if chart render is 'echarts', here it return the echarts config options
  if (getChartRender() === 'echarts') {
    const axisConfig = getSwappedAxisRole(styles, axisColumnMappings);
    const xAxis = axisConfig.xAxis;
    const yAxis = axisConfig.yAxis;

    if (!xAxis || !yAxis) {
      throw Error('Missing axis config for Bar chart');
    }

    let timeField = '';
    let valueField = '';
    if (xAxis.schema === VisFieldType.Date) {
      timeField = xAxis.column;
      valueField = yAxis.column;
    } else if (yAxis.schema === VisFieldType.Date) {
      timeField = yAxis.column;
      valueField = xAxis.column;
    }

    const timeUnit = styles.bucket?.bucketTimeUnit ?? TimeUnit.AUTO;
    const aggregationType = styles.bucket.aggregationType ?? AggregationType.SUM;
    const result = pipe(
      transform(
        aggregate({
          groupBy: timeField,
          field: valueField,
          timeUnit,
          aggregationType,
        }),
        convertTo2DArray()
      ),
      createBaseConfig({
        title: `${axisColumnMappings?.y?.name} Over Time`,
        legend: { show: false },
      }),
      buildAxisConfigs,
      applyTimeRange,
      buildVisMap({
        seriesFields: (headers) => (headers ?? []).filter((h) => h !== timeField),
      }),
      createBarSeries({
        kind: 'bar',
        styles,
        categoryField: timeField,
        seriesFields: [valueField],
      }),
      assembleSpec
    )({
      data: transformedData,
      styles,
      axisConfig,
      axisColumnMappings: axisColumnMappings ?? {},
      timeRange,
    });

    return result.spec;
  }

  const { xAxis, xAxisStyle, yAxis, yAxisStyle } = getSwappedAxisRole(styles, axisColumnMappings);

  const timeAxis = xAxis?.schema === VisFieldType.Date ? xAxis : yAxis;
  // Determine the numerical axis for the title
  const numericalAxis = xAxis?.schema === VisFieldType.Date ? yAxis : xAxis;

  const colorEncodingLayer = buildThresholdColorEncoding(numericalAxis, styles);

  const interval =
    styles?.bucket?.bucketTimeUnit === TimeUnit.AUTO
      ? inferTimeIntervals(transformedData, timeAxis?.column)
      : styles?.bucket?.bucketTimeUnit;

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

  const mainLayer = {
    params: [
      { name: 'highlight', select: { type: 'point', on: 'pointerover' } },
      createTimeRangeBrush({ timeAxis: styles.switchAxes ? 'y' : 'x' }),
    ],
    mark: barMark,
    encoding: {
      x: {
        ...buildEncoding(xAxis, xAxisStyle, interval, styles?.bucket?.aggregationType),
      },
      y: {
        ...buildEncoding(yAxis, yAxisStyle, interval, styles?.bucket?.aggregationType),
      },
      color: styles?.useThresholdColor ? colorEncodingLayer : [],
      ...(styles.tooltipOptions?.mode !== 'hidden' && {
        tooltip: [
          {
            ...buildTooltipEncoding(xAxis, xAxisStyle, interval, styles?.bucket?.aggregationType),
          },
          {
            ...buildTooltipEncoding(yAxis, yAxisStyle, interval, styles?.bucket?.aggregationType),
          },
        ],
      }),
      fillOpacity: {
        condition: { param: 'highlight', value: 1, empty: false },
        value: DEFAULT_OPACITY,
      },
    },
  };

  layers.push(mainLayer);

  const barEncodingDefault = yAxis?.schema === VisFieldType.Numerical ? 'y' : 'x';
  // Add threshold layer if enabled
  const thresholdLayer = createThresholdLayer(styles?.thresholdOptions, barEncodingDefault);
  if (thresholdLayer) {
    layers.push(...thresholdLayer.layer);
  }

  // Apply time range to main layer's scale if enabled
  if (styles.showFullTimeRange) {
    applyTimeRangeToEncoding(mainLayer.encoding, axisColumnMappings, timeRange, styles.switchAxes);
  }

  return {
    $schema: VEGASCHEMA,
    params: [...(timeAxis ? [createTimeRangeUpdater()] : [])],
    title: styles.titleOptions?.show
      ? styles.titleOptions?.titleName || `${numericalAxis?.name} Over Time`
      : undefined,
    data: { values: transformedData },
    layer: layers,
  };
};

/**
 * Create a grouped time-based bar chart with one metric, one category, and one date
 * @param transformedData The transformed data
 * @param numericalColumns The numerical columns
 * @param categoricalColumns The categorical columns
 * @param dateColumns The date columns
 * @param styles The style options
 * @returns The Vega spec for a grouped time-based bar chart
 */
export const createGroupedTimeBarChart = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styleOptions: BarChartStyle,
  axisColumnMappings?: AxisColumnMappings,
  timeRange?: { from: string; to: string }
): any => {
  if (getChartRender() === 'echarts') {
    const styles = { ...defaultBarChartStyles, ...styleOptions };
    // Extract configuration before pipeline
    const axisConfig = getSwappedAxisRole(styles, axisColumnMappings);
    const xAxis = axisConfig.xAxis;
    const yAxis = axisConfig.yAxis;
    const colorColumn = axisColumnMappings?.[AxisRole.COLOR];
    const colorField = colorColumn?.column;

    if (!xAxis || !yAxis) {
      throw Error('Missing axis config for grouped time bar chart');
    }

    let timeField = '';
    let valueField = '';
    if (xAxis.schema === VisFieldType.Date) {
      timeField = xAxis.column;
      valueField = yAxis.column;
    } else if (yAxis.schema === VisFieldType.Date) {
      timeField = yAxis.column;
      valueField = xAxis.column;
    }

    const timeUnit = styles?.bucket?.bucketTimeUnit ?? TimeUnit.AUTO;
    const aggregationType = styles?.bucket?.aggregationType ?? AggregationType.SUM;

    if (!colorField) {
      throw new Error('Color column is required for grouped time bar chart');
    }

    const result = pipe(
      transform(
        pivot({
          groupBy: timeField,
          pivot: colorField,
          field: valueField,
          timeUnit,
          aggregationType,
        }),
        convertTo2DArray()
      ),
      createBaseConfig({
        title: `${axisColumnMappings?.y?.name} Over Time by ${colorColumn.name}`,
        legend: { show: styles.addLegend },
      }),
      buildAxisConfigs,
      applyTimeRange,
      buildVisMap({
        seriesFields: (headers) => (headers ?? []).filter((h) => h !== timeField),
      }),
      createBarSeries({
        kind: 'bar',
        styles,
        categoryField: timeField,
        seriesFields(headers) {
          return (headers ?? []).filter((h) => h !== timeField);
        },
      }),
      assembleSpec
    )({
      data: transformedData,
      styles,
      axisConfig,
      axisColumnMappings: axisColumnMappings ?? {},
      timeRange,
    });

    return result.spec;
  }

  const styles = { ...defaultBarChartStyles, ...styleOptions };

  const { xAxis, xAxisStyle, yAxis, yAxisStyle } = getSwappedAxisRole(styles, axisColumnMappings);

  const colorColumn = axisColumnMappings?.[AxisRole.COLOR];
  const categoryField = colorColumn?.column;
  const categoryName = colorColumn?.name;

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

  const layer = [];
  const timeAxis = xAxis?.schema === VisFieldType.Date ? xAxis : yAxis;
  const interval =
    styles?.bucket?.bucketTimeUnit === TimeUnit.AUTO
      ? inferTimeIntervals(transformedData, timeAxis?.column)
      : styles?.bucket?.bucketTimeUnit;

  const barLayer: any = {
    $schema: VEGASCHEMA,
    title: styles.titleOptions?.show
      ? styles.titleOptions?.titleName || `${yAxis?.name} Over Time by ${categoryName}`
      : undefined,
    data: { values: transformedData },
    params: [
      { name: 'highlight', select: { type: 'point', on: 'pointerover' } },
      createTimeRangeBrush({ timeAxis: styles.switchAxes ? 'y' : 'x' }),
    ],
    mark: barMark,
    encoding: {
      x: {
        ...buildEncoding(xAxis, xAxisStyle, interval, styles?.bucket?.aggregationType),
      },
      y: {
        ...buildEncoding(yAxis, yAxisStyle, interval, styles?.bucket?.aggregationType),
      },
      color: {
        field: categoryField,
        type: 'nominal',
        legend: styles.addLegend
          ? {
              title: styles.legendTitle,
              orient: styles.legendPosition?.toLowerCase() || 'right',
              symbolType: styles.legendShape ?? 'circle',
            }
          : null,
      },
      // Optional: Add tooltip with all information
      tooltip: [
        {
          ...buildTooltipEncoding(xAxis, xAxisStyle, interval, styles?.bucket?.aggregationType),
        },
        {
          ...buildTooltipEncoding(yAxis, yAxisStyle, interval, styles?.bucket?.aggregationType),
        },
        { field: categoryField, type: getSchemaByAxis(colorColumn), title: categoryName },
      ],
      fillOpacity: {
        condition: { param: 'highlight', value: 1, empty: false },
        value: DEFAULT_OPACITY,
      },
    },
  };
  layer.push(barLayer);

  // Add threshold layer if enabled
  const barEncodingDefault = yAxis?.schema === VisFieldType.Numerical ? 'y' : 'x';
  const thresholdLayer = createThresholdLayer(styles?.thresholdOptions, barEncodingDefault);
  if (thresholdLayer) {
    layer.push(...thresholdLayer.layer);
  }

  // Apply time range to main layer's scale if enabled
  if (styles.showFullTimeRange) {
    applyTimeRangeToEncoding(barLayer.encoding, axisColumnMappings, timeRange, styles.switchAxes);
  }

  const spec: any = {
    $schema: VEGASCHEMA,
    params: [...(timeAxis ? [createTimeRangeUpdater()] : [])],
    title: styles.titleOptions?.show
      ? styles.titleOptions?.titleName || `${yAxis?.name} Over Time by ${categoryName}`
      : undefined,
    data: { values: transformedData },
    layer,
  };

  return spec;
};

/**
 * Create a faceted time-based bar chart with one metric, two categories, and one date
 * @param transformedData The transformed data
 * @param numericalColumns The numerical columns
 * @param categoricalColumns The categorical columns
 * @param dateColumns The date columns
 * @param styles The style options
 * @returns The Vega spec for a faceted time-based bar chart
 */
export const createFacetedTimeBarChart = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styleOptions: BarChartStyle,
  axisColumnMappings?: AxisColumnMappings,
  timeRange?: { from: string; to: string }
): any => {
  if (getChartRender() === 'echarts') {
    const styles = { ...defaultBarChartStyles, ...styleOptions };
    const axisConfig = getSwappedAxisRole(styles, axisColumnMappings);
    const xAxis = axisConfig.xAxis;
    const yAxis = axisConfig.yAxis;
    const colorColumn = axisColumnMappings?.[AxisRole.COLOR];
    const colorField = colorColumn?.column;

    const facetColumn = axisColumnMappings?.[AxisRole.FACET]?.column;

    if (!xAxis || !yAxis || !colorField || !facetColumn) {
      throw Error('Missing axis config for facet time bar chart');
    }

    let timeField = '';
    let valueField = '';
    if (xAxis.schema === VisFieldType.Date) {
      timeField = xAxis.column;
      valueField = yAxis.column;
    } else if (yAxis.schema === VisFieldType.Date) {
      timeField = yAxis.column;
      valueField = xAxis.column;
    }

    const timeUnit = styles?.bucket?.bucketTimeUnit ?? TimeUnit.AUTO;
    const aggregationType = styles?.bucket?.aggregationType ?? AggregationType.SUM;

    const result = pipe(
      facetTransform(
        facetColumn,
        pivot({
          groupBy: timeField,
          pivot: colorField,
          field: valueField,
          timeUnit,
          aggregationType,
        }),
        convertTo2DArray()
      ),
      createBaseConfig({
        title: `${axisColumnMappings.y?.name} Over Time by ${axisColumnMappings.color?.name} (Faceted by ${axisColumnMappings.facet?.name})`,
      }),
      buildAxisConfigs,
      applyTimeRange,
      buildVisMap({
        seriesFields: (headers) => (headers ?? []).filter((h) => h !== timeField),
      }),
      createFacetBarSeries({
        styles,
        categoryField: timeField,
        seriesFields: (headers) => (headers ?? []).filter((h) => h !== timeField),
      }),
      assembleSpec
    )({
      data: transformedData,
      styles,
      axisConfig,
      axisColumnMappings: axisColumnMappings ?? {},
      timeRange,
    });
    return result.spec;
  }

  const styles = { ...defaultBarChartStyles, ...styleOptions };
  const { xAxis, xAxisStyle, yAxis, yAxisStyle } = getSwappedAxisRole(styles, axisColumnMappings);
  const colorMapping = axisColumnMappings?.[AxisRole.COLOR];
  const facetMapping = axisColumnMappings?.[AxisRole.FACET];

  // @ts-expect-error TS6133 TODO(ts-error): fixme
  const metricField = yAxis?.column;
  // @ts-expect-error TS6133 TODO(ts-error): fixme
  const dateField = xAxis?.column;
  const category1Field = colorMapping?.column;
  const category2Field = facetMapping?.column;
  const metricName = yAxisStyle?.title?.text || yAxis?.name;
  // @ts-expect-error TS6133 TODO(ts-error): fixme
  const dateName = xAxisStyle?.title?.text || xAxis?.name;
  const category1Name = colorMapping?.name;
  const category2Name = facetMapping?.name;

  const timeAxis = xAxis?.schema === VisFieldType.Date ? xAxis : yAxis;

  const interval =
    styles?.bucket?.bucketTimeUnit === TimeUnit.AUTO
      ? inferTimeIntervals(transformedData, timeAxis?.column)
      : styles?.bucket?.bucketTimeUnit;

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

  const barEncodingDefault = yAxis?.schema === VisFieldType.Numerical ? 'y' : 'x';

  const thresholdLayer = createThresholdLayer(styles?.thresholdOptions, barEncodingDefault);

  // Create the main layer encoding first
  const mainLayerEncoding = {
    x: {
      ...buildEncoding(xAxis, xAxisStyle, interval, styles?.bucket?.aggregationType),
    },
    y: {
      ...buildEncoding(yAxis, yAxisStyle, interval, styles?.bucket?.aggregationType),
    },
    color: {
      field: category1Field,
      type: 'nominal',
      legend: styles.addLegend
        ? {
            title: styles.legendTitle,
            orient: styles.legendPosition?.toLowerCase() || 'right',
            symbolType: styles.legendShape ?? 'circle',
          }
        : null,
    },
    ...(styles.tooltipOptions?.mode !== 'hidden' && {
      tooltip: [
        {
          ...buildTooltipEncoding(xAxis, xAxisStyle, interval, styles?.bucket?.aggregationType),
        },
        {
          ...buildTooltipEncoding(yAxis, yAxisStyle, interval, styles?.bucket?.aggregationType),
        },
        { field: category1Field, type: 'nominal', title: category1Name },
      ],
    }),
    fillOpacity: {
      condition: { param: 'highlight', value: 1, empty: false },
      value: DEFAULT_OPACITY,
    },
  };

  // Apply time range to main layer's scale if enabled
  if (styles.showFullTimeRange && timeRange) {
    applyTimeRangeToEncoding(mainLayerEncoding, axisColumnMappings, timeRange, styles.switchAxes);
  }

  return {
    $schema: VEGASCHEMA,
    params: [...(timeAxis ? [createTimeRangeUpdater()] : [])],
    title: styles.titleOptions?.show
      ? styles.titleOptions?.titleName ||
        `${metricName} Over Time by ${category1Name} (Faceted by ${category2Name})`
      : undefined,
    data: { values: transformedData },
    facet: {
      field: category2Field,
      type: getSchemaByAxis(facetMapping),
      header: { title: category2Name },
    },
    spec: {
      layer: [
        {
          params: [
            { name: 'highlight', select: { type: 'point', on: 'pointerover' } },
            createTimeRangeBrush({ timeAxis: styles.switchAxes ? 'y' : 'x' }),
          ],
          mark: barMark,
          encoding: mainLayerEncoding,
        },

        // Add threshold layer to each facet if enabled
        ...(thresholdLayer?.layer ?? []),
      ],
    },
  };
};

export const createStackedBarSpec = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styleOptions: BarChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
  if (getChartRender() === 'echarts') {
    const styles = { ...defaultBarChartStyles, ...styleOptions };
    // Extract configuration before pipeline
    const axisConfig = getSwappedAxisRole(styles, axisColumnMappings);
    const xAxis = axisConfig.xAxis;
    const yAxis = axisConfig.yAxis;
    const colorMapping = axisColumnMappings?.[AxisRole.COLOR];
    const colorField = colorMapping?.column;

    if (!xAxis || !yAxis) {
      throw Error('Missing axis config for stacked bar chart');
    }

    let categoryField = '';
    let valueField = '';
    if (xAxis.schema === VisFieldType.Categorical) {
      categoryField = xAxis.column;
      valueField = yAxis.column;
    } else if (yAxis.schema === VisFieldType.Categorical) {
      categoryField = yAxis.column;
      valueField = xAxis.column;
    }

    const aggregationType = styles?.bucket?.aggregationType ?? AggregationType.SUM;

    if (!colorField) {
      throw new Error('Color column is required for stacked bar chart');
    }

    const result = pipe(
      transform(
        pivot({
          groupBy: categoryField,
          pivot: colorField,
          field: valueField,
          aggregationType,
        }),
        convertTo2DArray()
      ),
      createBaseConfig({
        title: `${axisColumnMappings?.y?.name} by ${axisColumnMappings?.x?.name} and ${colorMapping.name}`,
        legend: { show: styles.addLegend },
      }),
      buildAxisConfigs,
      buildVisMap({
        seriesFields: (headers) => (headers ?? []).filter((h) => h !== categoryField),
      }),
      createBarSeries({
        kind: 'bar',
        styles,
        categoryField,
        seriesFields(headers) {
          return (headers ?? []).filter((h) => h !== categoryField);
        },
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

  const styles = { ...defaultBarChartStyles, ...styleOptions };
  const { xAxis, xAxisStyle, yAxis, yAxisStyle } = getSwappedAxisRole(styles, axisColumnMappings);
  const colorMapping = axisColumnMappings?.[AxisRole.COLOR];

  const categoryField2 = colorMapping?.column;
  const categoryName2 = colorMapping?.name;

  // Set up encoding
  const categoryAxis = 'x';
  const valueAxis = 'y';

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

  const barLayer = {
    params: [{ name: 'highlight', select: { type: 'point', on: 'pointerover' } }],
    mark: barMark,
    encoding: {
      // Category axis (X or Y depending on orientation)
      [categoryAxis]: {
        ...buildEncoding(xAxis, xAxisStyle, undefined, styles?.bucket?.aggregationType),
      },
      // Value axis (Y or X depending on orientation)
      [valueAxis]: {
        ...buildEncoding(yAxis, yAxisStyle, undefined, styles?.bucket?.aggregationType),
      },
      // Color: Second categorical field (stacking)
      color: {
        field: categoryField2,
        type: 'nominal',
        legend: styles.addLegend
          ? {
              title: styles.legendTitle,
              orient: styles.legendPosition?.toLowerCase() || 'bottom',
              symbolType: styles.legendShape ?? 'circle',
            }
          : null,
      },
      // Optional: Add tooltip with all information if tooltip mode is not hidden
      ...(styles.tooltipOptions?.mode !== 'hidden' && {
        tooltip: [
          {
            ...buildTooltipEncoding(xAxis, xAxisStyle, undefined, styles?.bucket?.aggregationType),
          },
          {
            ...buildTooltipEncoding(yAxis, yAxisStyle, undefined, styles?.bucket?.aggregationType),
          },
          { field: categoryField2, type: 'nominal', title: categoryName2 },
        ],
      }),
      fillOpacity: {
        condition: { param: 'highlight', value: 1, empty: false },
        value: DEFAULT_OPACITY,
      },
    },
  };

  const layer = [barLayer];

  // Add threshold layer if enabled
  const barEncodingDefault = yAxis?.schema === VisFieldType.Numerical ? 'y' : 'x';
  const thresholdLayer = createThresholdLayer(styles?.thresholdOptions, barEncodingDefault);

  if (thresholdLayer) {
    layer.push(...thresholdLayer.layer);
  }

  const spec: any = {
    $schema: VEGASCHEMA,
    title: styles.titleOptions?.show
      ? styles.titleOptions?.titleName || `${yAxis?.name} by ${xAxis?.name} and ${categoryName2}`
      : undefined,
    data: { values: transformedData },
    layer,
  };

  return spec;
};

export const createDoubleNumericalBarChart = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  styleOptions: BarChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
  if (getChartRender() === 'echarts') {
    const styles = { ...defaultBarChartStyles, ...styleOptions };
    const axisConfig = getSwappedAxisRole(styles, axisColumnMappings);
    const xAxis = axisConfig.xAxis;
    const yAxis = axisConfig.yAxis;

    if (!xAxis || !yAxis) {
      throw Error('Missing axis config for Bar chart');
    }

    let categoryField = '';
    let valueField = '';

    categoryField = styles.switchAxes ? yAxis.column : xAxis.column;
    valueField = styles.switchAxes ? xAxis.column : yAxis.column;

    const aggregationType = styles.bucket.aggregationType ?? AggregationType.SUM;
    const result = pipe(
      transform(
        aggregate({
          groupBy: categoryField,
          field: valueField,
          aggregationType,
        }),
        convertTo2DArray()
      ),
      createBaseConfig({ title: `${xAxis?.name} with ${yAxis?.name}`, legend: { show: false } }),
      buildAxisConfigs,
      buildVisMap({
        seriesFields: (headers) => (headers ?? []).filter((h) => h !== categoryField),
      }),
      createBarSeries({ kind: 'bar', styles, categoryField, seriesFields: [valueField] }),
      assembleSpec
    )({
      data: transformedData,
      styles,
      axisConfig,
      axisColumnMappings: axisColumnMappings ?? {},
    });

    // TODO: check if this is needed
    if (styles.switchAxes) {
      result.yAxisConfig.type = 'category';
    } else {
      result.xAxisConfig.type = 'category';
    }

    return result.spec;
  }

  const styles = { ...defaultBarChartStyles, ...styleOptions };
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

  const colorEncodingLayer = buildThresholdColorEncoding(yAxis, styleOptions);

  const mainLayer = {
    mark: barMark,
    encoding: {
      x: {
        field: xAxis?.column,
        type: 'nominal',
        axis: applyAxisStyling({ axis: xAxis, axisStyle: xAxisStyle }),
      },
      y: {
        field: yAxis?.column,
        aggregate: styles?.bucket?.aggregationType,
        type: getSchemaByAxis(yAxis),
        axis: applyAxisStyling({ axis: yAxis, axisStyle: yAxisStyle }),
      },
      color: styleOptions?.useThresholdColor ? colorEncodingLayer : [],
      ...(styles.tooltipOptions?.mode !== 'hidden' && {
        tooltip: [
          {
            field: xAxis?.column,
            type: 'nominal',
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
