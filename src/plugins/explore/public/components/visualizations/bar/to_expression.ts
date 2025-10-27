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
import { applyAxisStyling, getSwappedAxisRole, getSchemaByAxis } from '../utils/utils';

import {
  inferTimeIntervals,
  buildEncoding,
  buildTooltipEncoding,
  adjustBucketBins,
  buildThresholdColorEncoding,
} from './bar_chart_utils';
import { DEFAULT_OPACITY } from '../constants';
import { createTimeRangeBrush, createTimeRangeUpdater } from '../utils/time_range_brush';

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
  // Check if we have the required columns
  if (numericalColumns.length === 0 || categoricalColumns.length === 0) {
    throw new Error('Bar chart requires at least one numerical column and one categorical column');
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
  styleOptions: BarChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
  // Check if we have the required columns
  if (numericalColumns.length === 0 || dateColumns.length === 0) {
    throw new Error('Time bar chart requires at least one numerical column and one date column');
  }

  const styles = { ...defaultBarChartStyles, ...styleOptions };

  const { xAxis, xAxisStyle, yAxis, yAxisStyle } = getSwappedAxisRole(styles, axisColumnMappings);

  const timeAxis = xAxis?.schema === VisFieldType.Date ? xAxis : yAxis;
  // Determine the numerical axis for the title
  const numericalAxis = xAxis?.schema === VisFieldType.Date ? yAxis : xAxis;

  const colorEncodingLayer = buildThresholdColorEncoding(numericalAxis, styleOptions);

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
      color: styleOptions?.useThresholdColor ? colorEncodingLayer : [],
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
  axisColumnMappings?: AxisColumnMappings
): any => {
  // Check if we have the required columns
  if (
    numericalColumns.length === 0 ||
    categoricalColumns.length === 0 ||
    dateColumns.length === 0
  ) {
    throw new Error(
      'Grouped time bar chart requires at least one numerical column, one categorical column, and one date column'
    );
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
        type: getSchemaByAxis(colorColumn),
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
  axisColumnMappings?: AxisColumnMappings
): any => {
  // Check if we have the required columns
  if (numericalColumns.length === 0 || categoricalColumns.length < 2 || dateColumns.length === 0) {
    throw new Error(
      'Faceted time bar chart requires at least one numerical column, two categorical columns, and one date column'
    );
  }

  const styles = { ...defaultBarChartStyles, ...styleOptions };
  const { xAxis, xAxisStyle, yAxis, yAxisStyle } = getSwappedAxisRole(styles, axisColumnMappings);
  const colorMapping = axisColumnMappings?.[AxisRole.COLOR];
  const facetMapping = axisColumnMappings?.[AxisRole.FACET];

  const metricField = yAxis?.column;
  const dateField = xAxis?.column;
  const category1Field = colorMapping?.column;
  const category2Field = facetMapping?.column;
  const metricName = yAxisStyle?.title?.text || yAxis?.name;
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
          encoding: {
            x: {
              ...buildEncoding(xAxis, xAxisStyle, interval, styles?.bucket?.aggregationType),
            },
            y: {
              ...buildEncoding(yAxis, yAxisStyle, interval, styles?.bucket?.aggregationType),
            },
            color: {
              field: category1Field,
              type: getSchemaByAxis(colorMapping),
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
                  ...buildTooltipEncoding(
                    xAxis,
                    xAxisStyle,
                    interval,
                    styles?.bucket?.aggregationType
                  ),
                },
                {
                  ...buildTooltipEncoding(
                    yAxis,
                    yAxisStyle,
                    interval,
                    styles?.bucket?.aggregationType
                  ),
                },
                { field: category1Field, type: 'nominal', title: category1Name },
              ],
            }),
            fillOpacity: {
              condition: { param: 'highlight', value: 1, empty: false },
              value: DEFAULT_OPACITY,
            },
          },
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
  // Check if we have the required columns
  if (numericalColumns.length === 0 || categoricalColumns.length < 2) {
    throw new Error(
      'Stacked bar chart requires at least one numerical column and two categorical columns'
    );
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

export const createNumericalHistogramBarChart = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  styleOptions: BarChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
  // Check if we have the required columns
  if (numericalColumns.length < 2) {
    throw new Error('Histogram bar chart requires at least two numerical column');
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
        type: getSchemaByAxis(xAxis),
        bin: adjustBucketBins(styles?.bucket, transformedData, xAxis?.column),
        axis: applyAxisStyling(xAxis, xAxisStyle),
      },
      y: {
        field: yAxis?.column,
        aggregate: styles?.bucket?.aggregationType,
        type: getSchemaByAxis(yAxis),
        axis: applyAxisStyling(yAxis, yAxisStyle),
      },
      color: styleOptions?.useThresholdColor ? colorEncodingLayer : [],
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

export const createSingleBarChart = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  styleOptions: BarChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
  // Check if we have the required columns
  if (numericalColumns.length < 1) {
    throw new Error('Histogram bar chart requires at least one numerical column');
  }

  const styles = { ...defaultBarChartStyles, ...styleOptions };
  const { xAxis, xAxisStyle, yAxis, yAxisStyle } = getSwappedAxisRole(styles, axisColumnMappings);

  const layers: any[] = [];

  // Configure bar mark
  const barMark: any = {
    type: 'bar',
    tooltip: styles.tooltipOptions?.mode !== 'hidden',
  };

  const colorEncodingLayer = buildThresholdColorEncoding(undefined, styleOptions);

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
        axis: applyAxisStyling(xAxis, xAxisStyle),
      },
      y: {
        aggregate: AggregationType.COUNT,
        type: 'quantitative',
        axis: applyAxisStyling(yAxis, yAxisStyle),
      },
      color: styleOptions?.useThresholdColor ? colorEncodingLayer : [],
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
