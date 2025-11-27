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
} from '../types';
import { BarChartStyle, defaultBarChartStyles } from './bar_vis_config';
import { createThresholdLayer } from '../style_panel/threshold/threshold_utils';
import {
  applyAxisStyling,
  getSwappedAxisRole,
  getSchemaByAxis,
  applyTimeRangeToEncoding,
} from '../utils/utils';

import {
  inferTimeIntervals,
  buildEncoding,
  buildTooltipEncoding,
  buildThresholdColorEncoding,
  buildValueMappingColorEncoding,
  // TODO use value_mapping_utils
  buildCombinedScale,
} from './bar_chart_utils';
import { DEFAULT_OPACITY } from '../constants';
import { createTimeRangeBrush, createTimeRangeUpdater } from '../utils/time_range_brush';
import {
  processData,
  generateTransformLayer,
  generateLabelExpr,
} from '../style_panel/value_mapping/value_mapping_utils';
import { transformBucketToCalculationMethod } from '../utils/calculation';

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
  const styles = { ...defaultBarChartStyles, ...styleOptions };

  const { xAxis, xAxisStyle, yAxis, yAxisStyle } = getSwappedAxisRole(styles, axisColumnMappings);

  const valueMappings = styleOptions?.valueMappingOptions?.valueMappings?.filter(
    (mapping) => mapping?.type === 'value'
  );

  const rangeMappings = styleOptions?.valueMappingOptions?.valueMappings?.filter(
    (mapping) => mapping?.type === 'range'
  );

  const categoricalColumn = styleOptions?.switchAxes ? yAxis?.column : xAxis?.column;
  const numericalColumn = styleOptions?.switchAxes ? xAxis?.column : yAxis?.column;

  const transformedCalculationMethod = transformBucketToCalculationMethod(
    styles?.bucket?.aggregationType
  );

  const { newRecord, validValues, validRanges } = processData({
    transformedData,
    categoricalColumn,
    numericalColumn,
    transformedCalculationMethod,
    valueMappings,
    rangeMappings,
  });

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

  const colorEncodingLayer =
    styleOptions.colorModeOption === 'useThresholdColor'
      ? buildThresholdColorEncoding(numericalAxis, styleOptions, true)
      : buildValueMappingColorEncoding(styleOptions, validValues, validRanges);

  const canUseValueMapping =
    ((validRanges && validRanges.length > 0) || (validValues && validValues.length > 0)) &&
    styleOptions.colorModeOption !== 'none' &&
    styleOptions.colorModeOption !== 'useThresholdColor';

  const mainLayer = {
    params: [{ name: 'highlight', select: { type: 'point', on: 'pointerover' } }],
    mark: barMark,
    encoding: {
      // Category axis (X or Y depending on orientation)
      [categoryAxis]: {
        ...buildEncoding(xAxis, xAxisStyle, undefined, styles?.bucket?.aggregationType, true),
      },
      // Value axis (Y or X depending on orientation)
      [valueAxis]: {
        ...buildEncoding(yAxis, yAxisStyle, undefined, styles?.bucket?.aggregationType, true),
      },
      color: colorEncodingLayer,
      ...(styles.tooltipOptions?.mode !== 'hidden' && {
        tooltip: [
          {
            ...buildTooltipEncoding(
              xAxis,
              xAxisStyle,
              undefined,
              styles?.bucket?.aggregationType,
              true
            ),
          },
          {
            ...buildTooltipEncoding(
              yAxis,
              yAxisStyle,
              undefined,
              styles?.bucket?.aggregationType,
              true
            ),
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
    data: { values: newRecord },
    transform: generateTransformLayer(
      canUseValueMapping,
      numericalColumn,
      rangeMappings,
      valueMappings,
      styleOptions?.colorModeOption
    ),
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
  const styles = { ...defaultBarChartStyles, ...styleOptions };

  const { xAxis, xAxisStyle, yAxis, yAxisStyle } = getSwappedAxisRole(styles, axisColumnMappings);
  const colorMapping = axisColumnMappings?.[AxisRole.COLOR];

  const categoryField2 = colorMapping?.column;
  const categoryName2 = colorMapping?.name;

  const valueMappings = styleOptions?.valueMappingOptions?.valueMappings?.filter(
    (mapping) => mapping?.type === 'value'
  );

  const rangeMappings = styleOptions?.valueMappingOptions?.valueMappings?.filter(
    (mapping) => mapping?.type === 'range'
  );

  const categoricalColumn = styleOptions?.switchAxes ? yAxis?.column : xAxis?.column;
  const numericalColumn = styleOptions?.switchAxes ? xAxis?.column : yAxis?.column;

  const transformedCalculationMethod = transformBucketToCalculationMethod(
    styles?.bucket?.aggregationType
  );

  const { newRecord, validValues, validRanges, categorical2Options } = processData({
    transformedData,
    categoricalColumn,
    numericalColumn,
    transformedCalculationMethod,
    valueMappings,
    rangeMappings,
    categoricalColumn2: categoryField2,
  });

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

  const canUseValueMapping =
    ((validRanges && validRanges.length > 0) || (validValues && validValues.length > 0)) &&
    styleOptions.colorModeOption !== 'none';

  const transformLayer = [
    ...generateTransformLayer(
      canUseValueMapping,
      numericalColumn,
      rangeMappings,
      valueMappings,
      styleOptions?.colorModeOption
    ),
    // create a new field for manual legend categories
    {
      calculate: `datum.mappingValue ? datum.mappingValue : datum['${categoryField2}']`,
      as: 'combinedCategory',
    },
  ];

  const barLayer = {
    params: [{ name: 'highlight', select: { type: 'point', on: 'pointerover' } }],
    mark: barMark,
    encoding: {
      // Category axis (X or Y depending on orientation)
      [categoryAxis]: {
        ...buildEncoding(xAxis, xAxisStyle, undefined, styles?.bucket?.aggregationType, true),
      },
      // Value axis (Y or X depending on orientation)
      [valueAxis]: {
        ...buildEncoding(yAxis, yAxisStyle, undefined, styles?.bucket?.aggregationType, true),
      },
      // Color: Second categorical field (stacking)
      color: {
        field: 'combinedCategory',
        type: 'nominal',
        scale: buildCombinedScale(
          canUseValueMapping,
          categorical2Options,
          validValues,
          validRanges
        ),
        legend: styles.addLegend
          ? {
              ...(canUseValueMapping && {
                labelExpr: generateLabelExpr(
                  rangeMappings,
                  valueMappings,
                  styleOptions?.colorModeOption
                ),
              }),
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
            ...buildTooltipEncoding(
              xAxis,
              xAxisStyle,
              undefined,
              styles?.bucket?.aggregationType,
              true
            ),
          },
          {
            ...buildTooltipEncoding(
              yAxis,
              yAxisStyle,
              undefined,
              styles?.bucket?.aggregationType,
              true
            ),
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
    data: { values: newRecord },
    transform: transformLayer,
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
  const styles = { ...defaultBarChartStyles, ...styleOptions };
  const { xAxis, xAxisStyle, yAxis, yAxisStyle } = getSwappedAxisRole(styles, axisColumnMappings);

  const valueMappings = styleOptions?.valueMappingOptions?.valueMappings?.filter(
    (mapping) => mapping?.type === 'value'
  );

  const rangeMappings = styleOptions?.valueMappingOptions?.valueMappings?.filter(
    (mapping) => mapping?.type === 'range'
  );

  const transformedCalculationMethod = transformBucketToCalculationMethod(
    styles?.bucket?.aggregationType
  );

  const { newRecord, validValues, validRanges } = processData({
    transformedData,
    categoricalColumn: xAxis?.column,
    numericalColumn: yAxis?.column,
    transformedCalculationMethod,
    valueMappings,
    rangeMappings,
  });

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

  const colorEncodingLayer =
    styleOptions.colorModeOption === 'useThresholdColor'
      ? buildThresholdColorEncoding(yAxis, styleOptions, true)
      : buildValueMappingColorEncoding(styleOptions, validValues, validRanges);
  // const colorEncodingLayer = buildThresholdColorEncoding(yAxis, styleOptions);

  const canUseValueMapping =
    ((validRanges && validRanges.length > 0) || (validValues && validValues.length > 0)) &&
    styleOptions.colorModeOption !== 'none' &&
    styleOptions.colorModeOption !== 'useThresholdColor';

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
        // aggregate: styles?.bucket?.aggregationType,
        type: getSchemaByAxis(yAxis),
        axis: applyAxisStyling({ axis: yAxis, axisStyle: yAxisStyle }),
      },
      color: colorEncodingLayer,
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
    data: { values: newRecord },
    transform: generateTransformLayer(
      canUseValueMapping,
      yAxis?.column,
      rangeMappings,
      valueMappings,
      styleOptions?.colorModeOption
    ),
    layer: layers,
  };
};
