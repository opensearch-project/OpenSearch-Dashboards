/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AxisColumnMappings, AxisRole, VEGASCHEMA, VisColumn, VisFieldType } from '../types';
import { BarChartStyleControls } from './bar_vis_config';
import { createThresholdLayer } from '../style_panel/threshold/utils';
import {
  applyAxisStyling,
  getSwappedAxisRole,
  getSchemaByAxis,
  getTooltipFormat,
} from '../utils/utils';

// Only set size and binSpacing in manual mode
const configureBarSizeAndSpacing = (barMark: any, styles: Partial<BarChartStyleControls>) => {
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
  styles: Partial<BarChartStyleControls>,
  axisColumnMappings?: AxisColumnMappings
): any => {
  // Check if we have the required columns
  if (numericalColumns.length === 0 || categoricalColumns.length === 0) {
    throw new Error('Bar chart requires at least one numerical column and one categorical column');
  }

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

  const mainLayer = {
    mark: barMark,
    encoding: {
      // Category axis (X or Y depending on orientation)
      [categoryAxis]: {
        field: xAxis?.column,
        type: getSchemaByAxis(xAxis),
        axis: applyAxisStyling(xAxis, xAxisStyle),
      },
      // Value axis (Y or X depending on orientation)
      [valueAxis]: {
        field: yAxis?.column,
        type: getSchemaByAxis(yAxis),
        axis: applyAxisStyling(yAxis, yAxisStyle),
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
        ],
      }),
    },
  };

  layers.push(mainLayer);

  const barEncodingDefault = yAxis?.schema === VisFieldType.Numerical ? 'y' : 'x';

  // Add threshold layer if enabled
  const thresholdLayer = createThresholdLayer(
    styles.thresholdLines,
    styles.tooltipOptions?.mode,
    barEncodingDefault
  );
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
    // Add legend configuration if needed, or explicitly set to null if disabled
    legend: styles.addLegend
      ? {
          orient: styles.legendPosition?.toLowerCase() || 'right',
        }
      : null,
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
  styles: Partial<BarChartStyleControls>,
  axisColumnMappings?: AxisColumnMappings
): any => {
  // Check if we have the required columns
  if (numericalColumns.length === 0 || dateColumns.length === 0) {
    throw new Error('Time bar chart requires at least one numerical column and one date column');
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

  const mainLayer = {
    mark: barMark,
    encoding: {
      x: {
        field: xAxis?.column,
        type: getSchemaByAxis(xAxis),
        axis: applyAxisStyling(xAxis, xAxisStyle),
      },
      y: {
        field: yAxis?.column,
        type: getSchemaByAxis(yAxis),
        axis: applyAxisStyling(yAxis, yAxisStyle),
      },
      ...(styles.tooltipOptions?.mode !== 'hidden' && {
        tooltip: [
          {
            field: xAxis?.column,
            type: getSchemaByAxis(xAxis),
            title: xAxisStyle?.title?.text || xAxis?.name,
            ...(getSchemaByAxis(xAxis) === 'temporal' && {
              format: getTooltipFormat(transformedData, xAxis?.column),
            }),
          },
          {
            field: yAxis?.column,
            type: getSchemaByAxis(yAxis),
            title: yAxisStyle?.title?.text || yAxis?.name,
            ...(getSchemaByAxis(yAxis) === 'temporal' && {
              format: getTooltipFormat(transformedData, yAxis?.column),
            }),
          },
        ],
      }),
    },
  };

  layers.push(mainLayer);

  const barEncodingDefault = yAxis?.schema === VisFieldType.Numerical ? 'y' : 'x';
  // Add threshold layer if enabled
  const thresholdLayer = createThresholdLayer(
    styles.thresholdLines,
    styles.tooltipOptions?.mode,
    barEncodingDefault
  );
  if (thresholdLayer) {
    layers.push(...thresholdLayer.layer);
  }

  // Determine the numerical axis for the title
  const numericalAxis = getSchemaByAxis(xAxis) === 'temporal' ? yAxis : xAxis;

  return {
    $schema: VEGASCHEMA,
    title: styles.titleOptions?.show
      ? styles.titleOptions?.titleName || `${numericalAxis?.name} Over Time`
      : undefined,
    data: { values: transformedData },
    layer: layers,
    // Add legend configuration if needed, or explicitly set to null if disabled
    legend: styles.addLegend
      ? {
          orient: styles.legendPosition?.toLowerCase() || 'right',
        }
      : null,
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
  styles: Partial<BarChartStyleControls>,
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

  const spec: any = {
    $schema: VEGASCHEMA,
    title: styles.titleOptions?.show
      ? styles.titleOptions?.titleName || `${yAxis?.name} Over Time by ${categoryName}`
      : undefined,
    data: { values: transformedData },
    mark: barMark,
    encoding: {
      x: {
        field: xAxis?.column,
        type: getSchemaByAxis(xAxis),
        axis: applyAxisStyling(xAxis, xAxisStyle),
      },
      y: {
        field: yAxis?.column,
        type: getSchemaByAxis(yAxis),
        axis: applyAxisStyling(yAxis, yAxisStyle),
      },
      color: {
        field: categoryField,
        type: getSchemaByAxis(colorColumn),
        legend: styles.addLegend
          ? {
              title: categoryName,
              orient: styles.legendPosition?.toLowerCase() || 'right',
            }
          : null,
      },
      // Optional: Add tooltip with all information
      tooltip: [
        {
          field: xAxis?.column,
          type: getSchemaByAxis(xAxis),
          title: xAxisStyle?.title?.text || xAxis?.name,
          ...(getSchemaByAxis(xAxis) === 'temporal' && {
            format: getTooltipFormat(transformedData, xAxis?.column),
          }),
        },
        { field: categoryField, type: getSchemaByAxis(colorColumn), title: categoryName },
        {
          field: yAxis?.column,
          type: getSchemaByAxis(yAxis),
          title: yAxisStyle?.title?.text || yAxis?.name,
          ...(getSchemaByAxis(yAxis) === 'temporal' && {
            format: getTooltipFormat(transformedData, yAxis?.column),
          }),
        },
      ],
    },
  };

  // Add threshold layer if enabled
  const barEncodingDefault = yAxis?.schema === VisFieldType.Numerical ? 'y' : 'x';
  const thresholdLayer = createThresholdLayer(
    styles.thresholdLines,
    styles.tooltipOptions?.mode,
    barEncodingDefault
  );
  if (thresholdLayer) {
    spec.layer = [{ mark: barMark, encoding: spec.encoding }, ...thresholdLayer.layer];
    delete spec.mark;
    delete spec.encoding;
  }

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
  styles: Partial<BarChartStyleControls>,
  axisColumnMappings?: AxisColumnMappings
): any => {
  // Check if we have the required columns
  if (numericalColumns.length === 0 || categoricalColumns.length < 2 || dateColumns.length === 0) {
    throw new Error(
      'Faceted time bar chart requires at least one numerical column, two categorical columns, and one date column'
    );
  }

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

  const thresholdLayer = createThresholdLayer(
    styles.thresholdLines,
    styles.tooltipOptions?.mode,
    barEncodingDefault
  );

  return {
    $schema: VEGASCHEMA,
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
          mark: barMark,
          encoding: {
            x: {
              field: dateField,
              type: getSchemaByAxis(xAxis),
              axis: applyAxisStyling(xAxis, xAxisStyle),
            },
            y: {
              field: metricField,
              type: getSchemaByAxis(yAxis),
              axis: applyAxisStyling(yAxis, yAxisStyle),
            },
            color: {
              field: category1Field,
              type: getSchemaByAxis(colorMapping),
              legend: styles.addLegend
                ? {
                    title: category1Name,
                    orient: styles.legendPosition?.toLowerCase() || 'right',
                  }
                : null,
            },
            ...(styles.tooltipOptions?.mode !== 'hidden' && {
              tooltip: [
                {
                  field: metricField,
                  type: getSchemaByAxis(yAxis),
                  title: metricName,
                  ...(getSchemaByAxis(yAxis) === 'temporal' && {
                    format: getTooltipFormat(transformedData, yAxis?.column),
                  }),
                },
                {
                  field: dateField,
                  type: getSchemaByAxis(xAxis),
                  title: dateName,
                  ...(getSchemaByAxis(xAxis) === 'temporal' && {
                    format: getTooltipFormat(transformedData, xAxis?.column),
                  }),
                },
                { field: category1Field, type: 'nominal', title: category1Name },
              ],
            }),
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
  styles: Partial<BarChartStyleControls>,
  axisColumnMappings?: AxisColumnMappings
): any => {
  // Check if we have the required columns
  if (numericalColumns.length === 0 || categoricalColumns.length < 2) {
    throw new Error(
      'Stacked bar chart requires at least one numerical column and two categorical columns'
    );
  }

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

  const spec: any = {
    $schema: VEGASCHEMA,
    title: styles.titleOptions?.show
      ? styles.titleOptions?.titleName || `${yAxis?.name} by ${xAxis?.name} and ${categoryName2}`
      : undefined,
    data: { values: transformedData },
    mark: barMark,
    encoding: {
      // Category axis (X or Y depending on orientation)
      [categoryAxis]: {
        field: xAxis?.column,
        type: getSchemaByAxis(xAxis),
        axis: applyAxisStyling(xAxis, xAxisStyle),
      },
      // Value axis (Y or X depending on orientation)
      [valueAxis]: {
        field: yAxis?.column,
        type: getSchemaByAxis(yAxis),
        axis: applyAxisStyling(yAxis, yAxisStyle),
        stack: 'zero', // Can be 'zero', 'normalize', or 'center'
      },
      // Color: Second categorical field (stacking)
      color: {
        field: categoryField2,
        type: 'nominal',
        legend: styles.addLegend
          ? {
              title: categoryName2,
              orient: styles.legendPosition?.toLowerCase() || 'bottom',
            }
          : null,
      },
      // Optional: Add tooltip with all information if tooltip mode is not hidden
      ...(styles.tooltipOptions?.mode !== 'hidden' && {
        tooltip: [
          { field: xAxis?.column, type: getSchemaByAxis(xAxis), title: xAxis?.name },
          { field: categoryField2, type: 'nominal', title: categoryName2 },
          { field: yAxis?.column, type: getSchemaByAxis(yAxis), title: yAxis?.name },
        ],
      }),
    },
  };

  // Add threshold layer if enabled
  const barEncodingDefault = yAxis?.schema === VisFieldType.Numerical ? 'y' : 'x';
  const thresholdLayer = createThresholdLayer(
    styles.thresholdLines,
    styles.tooltipOptions?.mode,
    barEncodingDefault
  );
  if (thresholdLayer) {
    spec.layer = [{ mark: barMark, encoding: spec.encoding }, ...thresholdLayer.layer];
    delete spec.mark;
    delete spec.encoding;
  }

  return spec;
};
