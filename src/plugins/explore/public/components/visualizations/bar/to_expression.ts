/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VEGASCHEMA, VisColumn } from '../types';
import { BarChartStyleControls } from './bar_vis_config';
import { applyAxisStyling } from '../line/line_chart_utils';
import { getStrokeDash, createThresholdLayer } from '../style_panel/threshold/utils';

export const createBarSpec = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: Partial<BarChartStyleControls>
): any => {
  // Check if we have the required columns
  if (numericalColumns.length === 0 || categoricalColumns.length === 0) {
    throw new Error('Bar chart requires at least one numerical column and one categorical column');
  }

  const metricField = numericalColumns[0].column;
  const categoryField = categoricalColumns[0].column;
  const metricName = numericalColumns[0].name;
  const categoryName = categoricalColumns[0].name;
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
        field: categoryField,
        type: 'nominal',
        axis: applyAxisStyling(
          {
            title: categoryName,
            labelAngle: -45,
          },
          styles,
          'category',
          numericalColumns,
          categoricalColumns,
          dateColumns
        ),
      },
      // Value axis (Y or X depending on orientation)
      [valueAxis]: {
        field: metricField,
        type: 'quantitative',
        axis: applyAxisStyling(
          { title: metricName },
          styles,
          'value',
          numericalColumns,
          categoricalColumns,
          dateColumns
        ),
      },
    },
  };

  layers.push(mainLayer);

  // Add threshold layer if enabled
  const thresholdLayer = createThresholdLayer(styles.thresholdLines, styles.tooltipOptions?.mode);
  if (thresholdLayer) {
    layers.push(thresholdLayer);
  }

  return {
    $schema: VEGASCHEMA,
    title: `${metricName} by ${categoryName}`,
    data: { values: transformedData },
    layer: layers,
    // Add legend configuration if needed
    ...(styles.addLegend && {
      legend: {
        orient: styles.legendPosition?.toLowerCase() || 'right',
      },
    }),
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
  styles: Partial<BarChartStyleControls>
): any => {
  // Check if we have the required columns
  if (numericalColumns.length === 0 || dateColumns.length === 0) {
    throw new Error('Time bar chart requires at least one numerical column and one date column');
  }

  const metricField = numericalColumns[0].column;
  const dateField = dateColumns[0].column;
  const metricName = numericalColumns[0].name;
  const dateName = dateColumns[0].name;
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
        type: 'temporal',
        axis: applyAxisStyling(
          {
            title: dateName,
            labelAngle: -45,
          },
          styles,
          'category',
          numericalColumns,
          [],
          dateColumns
        ),
      },
      y: {
        field: metricField,
        type: 'quantitative',
        axis: applyAxisStyling(
          { title: metricName },
          styles,
          'value',
          numericalColumns,
          [],
          dateColumns
        ),
      },
    },
  };

  layers.push(mainLayer);

  // Add threshold layer if enabled
  const thresholdLayer = createThresholdLayer(styles.thresholdLines, styles.tooltipOptions?.mode);
  if (thresholdLayer) {
    layers.push(thresholdLayer);
  }

  return {
    $schema: VEGASCHEMA,
    title: `${metricName} Over Time`,
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
  styles: Partial<BarChartStyleControls>
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

  const metricField = numericalColumns[0].column;
  const categoryField = categoricalColumns[0].column;
  const dateField = dateColumns[0].column;
  const metricName = numericalColumns[0].name;
  const categoryName = categoricalColumns[0].name;
  const dateName = dateColumns[0].name;

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
        type: 'temporal',
        axis: applyAxisStyling(
          {
            title: dateName,
            labelAngle: -45,
          },
          styles,
          'category',
          numericalColumns,
          categoricalColumns,
          dateColumns
        ),
      },
      y: {
        field: metricField,
        type: 'quantitative',
        axis: applyAxisStyling(
          { title: metricName },
          styles,
          'value',
          numericalColumns,
          categoricalColumns,
          dateColumns
        ),
      },
      color: {
        field: categoryField,
        type: 'nominal',
        legend: styles.addLegend
          ? {
              title: categoryName,
              orient: styles.legendPosition?.toLowerCase() || 'right',
            }
          : null,
      },
      // Optional: Add tooltip with all information
      tooltip: [
        { field: dateField, type: 'temporal', title: dateName },
        { field: categoryField, type: 'nominal', title: categoryName },
        { field: metricField, type: 'quantitative', title: metricName },
      ],
    },
  };

  // Add threshold layer if enabled
  const thresholdLayer = createThresholdLayer(styles.thresholdLines, styles.tooltipOptions?.mode);
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
  styles: Partial<BarChartStyleControls>
): any => {
  // Check if we have the required columns
  if (numericalColumns.length === 0 || categoricalColumns.length < 2 || dateColumns.length === 0) {
    throw new Error(
      'Faceted time bar chart requires at least one numerical column, two categorical columns, and one date column'
    );
  }

  const metricField = numericalColumns[0].column;
  const category1Field = categoricalColumns[0].column;
  const category2Field = categoricalColumns[1].column;
  const dateField = dateColumns[0].column;
  const metricName = numericalColumns[0].name;
  const category1Name = categoricalColumns[0].name;
  const category2Name = categoricalColumns[1].name;
  const dateName = dateColumns[0].name;

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
      type: 'nominal',
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
              type: 'temporal',
              axis: applyAxisStyling(
                {
                  title: dateName,
                  labelAngle: -45,
                },
                styles,
                'category',
                numericalColumns,
                categoricalColumns,
                dateColumns
              ),
            },
            y: {
              field: metricField,
              type: 'quantitative',
              axis: applyAxisStyling(
                { title: metricName },
                styles,
                'value',
                numericalColumns,
                categoricalColumns,
                dateColumns
              ),
            },
            color: {
              field: category1Field,
              type: 'nominal',
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
                  y: { value: threshold.value || 0 },
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
  styles: Partial<BarChartStyleControls>
): any => {
  // Check if we have the required columns
  if (numericalColumns.length === 0 || categoricalColumns.length < 2) {
    throw new Error(
      'Stacked bar chart requires at least one numerical column and two categorical columns'
    );
  }

  const metricField = numericalColumns[0].column;
  const categoryField1 = categoricalColumns[0].column; // Y-axis (categories)
  const categoryField2 = categoricalColumns[1].column; // Color (stacking)

  const metricName = numericalColumns[0].name;
  const categoryName1 = categoricalColumns[0].name;
  const categoryName2 = categoricalColumns[1].name;

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
        type: 'nominal',
        axis: applyAxisStyling(
          {
            title: categoryName1,
            labelAngle: -45,
          },
          styles,
          'category',
          numericalColumns,
          categoricalColumns,
          dateColumns
        ),
      },
      // Value axis (Y or X depending on orientation)
      [valueAxis]: {
        field: metricField,
        type: 'quantitative',
        axis: applyAxisStyling(
          { title: metricName },
          styles,
          'value',
          numericalColumns,
          categoricalColumns,
          dateColumns
        ),
        stack: 'normalize', // Can be 'zero', 'normalize', or 'center'
      },
      // Color: Second categorical field (stacking)
      color: {
        field: categoryField2,
        type: 'nominal',
        legend: {
          title: categoryName2,
          orient: styles.legendPosition?.toLowerCase() || 'bottom',
        },
      },
      // Optional: Add tooltip with all information
      tooltip: [
        { field: categoryField1, type: 'nominal', title: categoryName1 },
        { field: categoryField2, type: 'nominal', title: categoryName2 },
        { field: metricField, type: 'quantitative', title: metricName },
      ],
    },
  };

  // Add threshold layer if enabled
  const thresholdLayer = createThresholdLayer(styles.thresholdLines, styles.tooltipOptions?.mode);
  if (thresholdLayer) {
    spec.layer = [{ mark: barMark, encoding: spec.encoding }, ...thresholdLayer.layer];
    delete spec.mark;
    delete spec.encoding;
  }

  return spec;
};
