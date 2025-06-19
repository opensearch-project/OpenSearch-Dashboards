/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VEGASCHEMA, VisColumn } from '../types';
import { BarChartStyleControls } from './bar_vis_config';
import { getStrokeDash, applyAxisStyling } from '../line/line_chart_utils';

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
    tooltip: styles.addTooltip !== false,
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

  // Add threshold line if enabled
  if (styles.thresholdLine?.show) {
    const thresholdLayer = {
      mark: {
        type: 'rule',
        color: styles.thresholdLine.color || '#E7664C',
        strokeWidth: styles.thresholdLine.width || 1,
        strokeDash: getStrokeDash(styles.thresholdLine.style),
        tooltip: false,
      },
      encoding: {
        [valueAxis]: { value: styles.thresholdLine.value || 0 },
      },
    };
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
    tooltip: styles.addTooltip !== false,
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

  // Add threshold line if enabled
  if (styles.thresholdLine?.show) {
    spec.layer = [
      { mark: barMark, encoding: spec.encoding },
      {
        mark: {
          type: 'rule',
          color: styles.thresholdLine.color || '#E7664C',
          strokeWidth: styles.thresholdLine.width || 1,
          strokeDash: getStrokeDash(styles.thresholdLine.style),
          tooltip: false,
        },
        encoding: {
          [valueAxis]: { value: styles.thresholdLine.value || 0 },
        },
      },
    ];
    delete spec.mark;
    delete spec.encoding;
  }

  return spec;
};
