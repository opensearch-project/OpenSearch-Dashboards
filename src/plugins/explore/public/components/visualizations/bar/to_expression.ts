/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AxisColumnMappings, AxisRole, VEGASCHEMA, VisColumn, VisFieldType } from '../types';
import { BarChartStyleControls } from './bar_vis_config';
import { getStrokeDash, createThresholdLayer } from '../style_panel/threshold/utils';
import { applyAxisStyling, getSchemaFromAxisMapping } from '../utils/utils';

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

  const xAxis = axisColumnMappings?.x;
  const yAxis = axisColumnMappings?.y;

  const metricName = yAxis?.name;
  const categoryName = xAxis?.name;

  const layers: any[] = [];

  // Set up encoding
  const categoryAxis = 'x';
  const valueAxis = 'y';

  // Configure bar mark
  const barMark: any = {
    type: 'bar',
    tooltip: styles.tooltipOptions?.mode !== 'hidden',
    size: styles.barWidth ? styles.barWidth * 20 : 14, // Scale the bar width
    binSpacing: styles.barPadding ? styles.barPadding * 10 : 1, // Scale the bar padding
  };

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
        type: getSchemaFromAxisMapping(xAxis),
        axis: applyAxisStyling(xAxis, styles?.grid?.xLines),
      },
      // Value axis (Y or X depending on orientation)
      [valueAxis]: {
        field: yAxis?.column,
        type: getSchemaFromAxisMapping(yAxis),
        axis: applyAxisStyling(yAxis, styles?.grid?.yLines),
      },
    },
  };

  layers.push(mainLayer);

  const encodingDefault = xAxis?.schema === VisFieldType.Categorical ? 'y' : 'x';

  // Add threshold layer if enabled
  const thresholdLayer = createThresholdLayer(
    styles.thresholdLines,
    styles.tooltipOptions?.mode,
    encodingDefault
  );
  if (thresholdLayer) {
    layers.push(...thresholdLayer.layer);
  }

  return {
    $schema: VEGASCHEMA,
    title: `${metricName} by ${categoryName}`,
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

  const yAxisColumn = axisColumnMappings?.[AxisRole.Y];
  const xAxisColumn = axisColumnMappings?.[AxisRole.X];

  const metricField = yAxisColumn?.column;
  const dateField = xAxisColumn?.column;
  const metricName = yAxisColumn?.name;
  const dateName = xAxisColumn?.name;
  const layers: any[] = [];

  // Configure bar mark
  const barMark: any = {
    type: 'bar',
    tooltip: styles.tooltipOptions?.mode !== 'hidden',
    size: styles.barWidth ? styles.barWidth * 20 : 14, // Scale the bar width
    binSpacing: styles.barPadding ? styles.barPadding * 10 : 1, // Scale the bar padding
  };

  // Add border if enabled
  if (styles.showBarBorder) {
    barMark.stroke = styles.barBorderColor || '#000000';
    barMark.strokeWidth = styles.barBorderWidth || 1;
  }

  const mainLayer = {
    mark: barMark,
    encoding: {
      x: {
        field: dateField,
        type: getSchemaFromAxisMapping(xAxisColumn),
        axis: applyAxisStyling(xAxisColumn, styles?.grid?.xLines),
      },
      y: {
        field: metricField,
        type: getSchemaFromAxisMapping(yAxisColumn),
        axis: applyAxisStyling(yAxisColumn, styles?.grid?.yLines),
      },
    },
  };

  layers.push(mainLayer);

  const encodingDefault = yAxisColumn?.schema === VisFieldType.Numerical ? 'y' : 'x';

  // Add threshold layer if enabled
  const thresholdLayer = createThresholdLayer(
    styles.thresholdLines,
    styles.tooltipOptions?.mode,
    encodingDefault
  );
  if (thresholdLayer) {
    layers.push(...thresholdLayer.layer);
  }

  return {
    $schema: VEGASCHEMA,
    title: `${metricName} Over Time`,
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

  const yAxisColumn = axisColumnMappings?.[AxisRole.Y];
  const xAxisColumn = axisColumnMappings?.[AxisRole.X];
  const colorColumn = axisColumnMappings?.[AxisRole.COLOR];

  const metricField = yAxisColumn?.column;
  const dateField = xAxisColumn?.column;
  const metricName = yAxisColumn?.name;
  const dateName = xAxisColumn?.name;
  const categoryField = colorColumn?.column;
  const categoryName = colorColumn?.name;

  // Configure bar mark
  const barMark: any = {
    type: 'bar',
    tooltip: styles.tooltipOptions?.mode !== 'hidden',
    size: styles.barWidth ? styles.barWidth * 20 : 14, // Scale the bar width
    binSpacing: styles.barPadding ? styles.barPadding * 10 : 1, // Scale the bar padding
  };

  // Add border if enabled
  if (styles.showBarBorder) {
    barMark.stroke = styles.barBorderColor || '#000000';
    barMark.strokeWidth = styles.barBorderWidth || 1;
  }

  const spec: any = {
    $schema: VEGASCHEMA,
    title: `${metricName} Over Time by ${categoryName}`,
    data: { values: transformedData },
    mark: barMark,
    encoding: {
      x: {
        field: dateField,
        type: getSchemaFromAxisMapping(xAxisColumn),
        axis: applyAxisStyling(xAxisColumn, styles?.grid?.xLines),
      },
      y: {
        field: metricField,
        type: getSchemaFromAxisMapping(yAxisColumn),
        axis: applyAxisStyling(yAxisColumn, styles?.grid?.yLines),
        stack: 'zero',
      },
      color: {
        field: categoryField,
        type: getSchemaFromAxisMapping(colorColumn),
        legend: styles.addLegend
          ? {
              title: categoryName,
              orient: styles.legendPosition?.toLowerCase() || 'right',
            }
          : null,
      },
      // Optional: Add tooltip with all information
      tooltip: [
        { field: dateField, type: getSchemaFromAxisMapping(xAxisColumn), title: dateName },
        { field: categoryField, type: getSchemaFromAxisMapping(colorColumn), title: categoryName },
        { field: metricField, type: getSchemaFromAxisMapping(yAxisColumn), title: metricName },
      ],
    },
  };

  const encodingDefault = yAxisColumn?.schema === VisFieldType.Numerical ? 'y' : 'x';

  // Add threshold layer if enabled
  const thresholdLayer = createThresholdLayer(
    styles.thresholdLines,
    styles.tooltipOptions?.mode,
    encodingDefault
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

  const yAxisMapping = axisColumnMappings?.[AxisRole.Y];
  const xAxisMapping = axisColumnMappings?.[AxisRole.X];
  const colorMapping = axisColumnMappings?.[AxisRole.COLOR];
  const facetMapping = axisColumnMappings?.[AxisRole.FACET];

  const metricField = yAxisMapping?.column;
  const dateField = xAxisMapping?.column;
  const category1Field = colorMapping?.column;
  const category2Field = facetMapping?.column;
  const metricName = yAxisMapping?.name;
  const dateName = xAxisMapping?.name;
  const category1Name = colorMapping?.name;
  const category2Name = facetMapping?.name;

  // Configure bar mark
  const barMark: any = {
    type: 'bar',
    tooltip: styles.tooltipOptions?.mode !== 'hidden',
    size: styles.barWidth ? styles.barWidth * 20 : 14, // Scale the bar width
    binSpacing: styles.barPadding ? styles.barPadding * 10 : 1, // Scale the bar padding
  };

  // Add border if enabled
  if (styles.showBarBorder) {
    barMark.stroke = styles.barBorderColor || '#000000';
    barMark.strokeWidth = styles.barBorderWidth || 1;
  }

  const encodingDefault = yAxisMapping?.schema === VisFieldType.Numerical ? 'y' : 'x';

  return {
    $schema: VEGASCHEMA,
    title: `${metricName} Over Time by ${category1Name} (Faceted by ${category2Name})`,
    data: { values: transformedData },
    // Add a max width to the entire visualization and make it scrollable
    width: 'container',
    autosize: {
      type: 'fit-x',
      contains: 'padding',
    },
    facet: {
      field: category2Field,
      type: getSchemaFromAxisMapping(facetMapping),
      columns: 2,
      header: { title: category2Name },
    },
    spec: {
      width: 250, // Reduced from 300 to fit better
      height: 200,
      layer: [
        {
          mark: barMark,
          encoding: {
            x: {
              field: dateField,
              type: getSchemaFromAxisMapping(xAxisMapping),
              axis: applyAxisStyling(xAxisMapping, styles?.grid?.xLines),
            },
            y: {
              field: metricField,
              type: getSchemaFromAxisMapping(yAxisMapping),
              axis: applyAxisStyling(yAxisMapping, styles?.grid?.yLines),
            },
            color: {
              field: category1Field,
              type: getSchemaFromAxisMapping(colorMapping),
              legend: styles.addLegend
                ? {
                    title: category1Name,
                    orient: styles.legendPosition?.toLowerCase() || 'right',
                  }
                : null,
            },
          },
        },

        // Add threshold layer to each facet if enabled
        ...(styles.thresholdLines && styles.thresholdLines.length > 0
          ? styles.thresholdLines
              .filter((threshold) => threshold.show)
              .map((threshold) => ({
                mark: {
                  type: 'rule',
                  color: threshold.color || '#E7664C',
                  strokeWidth: threshold.width || 1,
                  strokeDash: getStrokeDash(threshold.style),
                  tooltip: styles.tooltipOptions?.mode !== 'hidden',
                },
                encoding: {
                  [encodingDefault]: { value: threshold.value || 0 },
                  ...(styles.tooltipOptions?.mode !== 'hidden' && {
                    tooltip: {
                      value: `${threshold.name ? threshold.name + ': ' : ''}Threshold: ${
                        threshold.value
                      }`,
                    },
                  }),
                },
              }))
          : []),
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

  const yAxisMapping = axisColumnMappings?.[AxisRole.Y];
  const xAxisMapping = axisColumnMappings?.[AxisRole.X];
  const colorMapping = axisColumnMappings?.[AxisRole.COLOR];

  const metricField = yAxisMapping?.column;
  const categoryField1 = xAxisMapping?.column;
  const categoryField2 = colorMapping?.column;
  const metricName = yAxisMapping?.name;
  const categoryName1 = xAxisMapping?.name;
  const categoryName2 = colorMapping?.name;

  // Set up encoding
  const categoryAxis = 'x';
  const valueAxis = 'y';

  // Configure bar mark
  const barMark: any = {
    type: 'bar',
    tooltip: styles.tooltipOptions?.mode !== 'hidden',
    size: styles.barWidth ? styles.barWidth * 20 : 14, // Scale the bar width
    binSpacing: styles.barPadding ? styles.barPadding * 10 : 1, // Scale the bar padding
  };

  // Add border if enabled
  if (styles.showBarBorder) {
    barMark.stroke = styles.barBorderColor || '#000000';
    barMark.strokeWidth = styles.barBorderWidth || 1;
  }

  const spec: any = {
    $schema: VEGASCHEMA,
    title: `${metricName} by ${categoryName1} and ${categoryName2}`,
    data: { values: transformedData },
    mark: barMark,
    encoding: {
      // Category axis (X or Y depending on orientation)
      [categoryAxis]: {
        field: categoryField1,
        type: getSchemaFromAxisMapping(xAxisMapping),
        axis: applyAxisStyling(xAxisMapping, styles?.grid?.xLines),
      },
      // Value axis (Y or X depending on orientation)
      [valueAxis]: {
        field: metricField,
        type: getSchemaFromAxisMapping(yAxisMapping),
        axis: applyAxisStyling(yAxisMapping, styles?.grid?.yLines),
        stack: 'zero', // Can be 'zero', 'normalize', or 'center'
      },
      // Color: Second categorical field (stacking)
      color: {
        field: categoryField2,
        type: getSchemaFromAxisMapping(colorMapping),
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
          {
            field: categoryField1,
            type: getSchemaFromAxisMapping(xAxisMapping),
            title: categoryName1,
          },
          {
            field: categoryField2,
            type: getSchemaFromAxisMapping(colorMapping),
            title: categoryName2,
          },
          { field: metricField, type: getSchemaFromAxisMapping(yAxisMapping), title: metricName },
        ],
      }),
    },
  };
  const encodingDefault = xAxisMapping?.schema === VisFieldType.Categorical ? 'y' : 'x';

  // Add threshold layer if enabled
  const thresholdLayer = createThresholdLayer(
    styles.thresholdLines,
    styles.tooltipOptions?.mode,
    encodingDefault
  );
  if (thresholdLayer) {
    spec.layer = [{ mark: barMark, encoding: spec.encoding }, ...thresholdLayer.layer];
    delete spec.mark;
    delete spec.encoding;
  }

  return spec;
};
