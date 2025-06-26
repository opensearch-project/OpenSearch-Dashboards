/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import { LineVisStyleControls } from './line_vis_options';
import { LineChartStyleControls } from './line_vis_config';
import { ThresholdLineStyle, VisColumn, VisFieldType, Positions } from '../types';

export default {
  component: LineVisStyleControls,
  title: 'src/plugins/explore/public/components/visualizations/line/line_vis_options',
} as ComponentMeta<typeof LineVisStyleControls>;

// Mock data for the component props
const mockNumericalColumns: VisColumn[] = [
  {
    id: 1,
    name: 'count',
    schema: VisFieldType.Numerical,
    column: 'count',
    validValuesCount: 10,
    uniqueValuesCount: 5,
  },
  {
    id: 2,
    name: 'price',
    schema: VisFieldType.Numerical,
    column: 'price',
    validValuesCount: 10,
    uniqueValuesCount: 8,
  },
  {
    id: 3,
    name: 'revenue',
    schema: VisFieldType.Numerical,
    column: 'revenue',
    validValuesCount: 10,
    uniqueValuesCount: 7,
  },
];

const mockCategoricalColumns: VisColumn[] = [
  {
    id: 4,
    name: 'category',
    schema: VisFieldType.Categorical,
    column: 'category',
    validValuesCount: 10,
    uniqueValuesCount: 3,
  },
  {
    id: 5,
    name: 'product',
    schema: VisFieldType.Categorical,
    column: 'product',
    validValuesCount: 10,
    uniqueValuesCount: 5,
  },
];

const mockDateColumns: VisColumn[] = [
  {
    id: 6,
    name: 'timestamp',
    schema: VisFieldType.Date,
    column: 'timestamp',
    validValuesCount: 10,
    uniqueValuesCount: 10,
  },
];

// Mock chart types for the ChartTypeSwitcher
const mockAvailableChartTypes = [
  { type: 'line', priority: 100, name: 'Line Chart' },
  { type: 'bar', priority: 80, name: 'Bar Chart' },
  { type: 'area', priority: 60, name: 'Area Chart' },
];

// Default style options
const defaultStyleOptions: LineChartStyleControls = {
  // Basic controls
  addLegend: true,
  legendPosition: Positions.RIGHT,
  addTimeMarker: false,

  // Line specific controls
  lineStyle: 'both',
  lineMode: 'smooth',
  lineWidth: 2,
  tooltipOptions: {
    mode: 'all',
  },

  // Threshold and grid
  thresholdLine: {
    color: '#E7664C',
    show: false,
    style: ThresholdLineStyle.Full,
    value: 10,
    width: 1,
  },
  grid: {
    categoryLines: true,
    valueLines: true,
  },

  // Category axes
  categoryAxes: [
    {
      id: 'CategoryAxis-1',
      type: 'category',
      position: Positions.BOTTOM,
      show: true,
      labels: {
        show: true,
        filter: true,
        rotate: 0,
        truncate: 100,
      },
      title: {
        text: 'Category Axis',
      },
    },
  ],

  // Value axes
  valueAxes: [
    {
      id: 'ValueAxis-1',
      name: 'LeftAxis-1',
      type: 'value',
      position: Positions.LEFT,
      show: true,
      labels: {
        show: true,
        rotate: 0,
        filter: false,
        truncate: 100,
      },
      title: {
        text: 'Value Axis',
      },
    },
  ],
};

// Template for the story
const Template: ComponentStory<typeof LineVisStyleControls> = (args) => {
  // Use state to track changes
  const [styleOptions, setStyleOptions] = useState<LineChartStyleControls>(args.styleOptions);

  return (
    <div style={{ maxWidth: '800px', padding: '16px' }}>
      <LineVisStyleControls
        {...args}
        styleOptions={styleOptions}
        onStyleChange={(newOptions) => {
          setStyleOptions({
            ...styleOptions,
            ...newOptions,
          });
          action('onStyleChange')(newOptions);
        }}
      />
    </div>
  );
};

// Primary story
export const Primary = Template.bind({});
Primary.args = {
  styleOptions: defaultStyleOptions,
  numericalColumns: mockNumericalColumns,
  categoricalColumns: mockCategoricalColumns,
  dateColumns: mockDateColumns,
  availableChartTypes: mockAvailableChartTypes,
  selectedChartType: 'line',
  onChartTypeChange: action('onChartTypeChange'),
};

// Story with threshold line enabled
export const WithThreshold = Template.bind({});
WithThreshold.args = {
  styleOptions: {
    ...defaultStyleOptions,
    thresholdLine: {
      ...defaultStyleOptions.thresholdLine,
      show: true,
    },
  },
  numericalColumns: mockNumericalColumns,
  categoricalColumns: mockCategoricalColumns,
  dateColumns: mockDateColumns,
  availableChartTypes: mockAvailableChartTypes,
  selectedChartType: 'line',
  onChartTypeChange: action('onChartTypeChange'),
};

// multiple value axes
export const MultipleValueAxes = Template.bind({});
MultipleValueAxes.args = {
  styleOptions: {
    ...defaultStyleOptions,
    valueAxes: [
      ...defaultStyleOptions.valueAxes,
      {
        id: 'ValueAxis-2',
        name: 'RightAxis-1',
        type: 'value',
        position: Positions.RIGHT,
        show: true,
        labels: {
          show: true,
          rotate: 0,
          filter: false,
          truncate: 100,
        },
        title: {
          text: 'Secondary Value Axis',
        },
      },
    ],
  },
  numericalColumns: mockNumericalColumns,
  categoricalColumns: mockCategoricalColumns,
  dateColumns: mockDateColumns,
  availableChartTypes: mockAvailableChartTypes,
  selectedChartType: 'line',
  onChartTypeChange: action('onChartTypeChange'),
};

// no grid lines
export const NoGridLines = Template.bind({});
NoGridLines.args = {
  styleOptions: {
    ...defaultStyleOptions,
    grid: {
      categoryLines: false,
      valueLines: false,
    },
  },
  numericalColumns: mockNumericalColumns,
  categoricalColumns: mockCategoricalColumns,
  dateColumns: mockDateColumns,
  availableChartTypes: mockAvailableChartTypes,
  selectedChartType: 'line',
  onChartTypeChange: action('onChartTypeChange'),
};

// different chart type selected
export const BarChartSelected = Template.bind({});
BarChartSelected.args = {
  styleOptions: defaultStyleOptions,
  numericalColumns: mockNumericalColumns,
  categoricalColumns: mockCategoricalColumns,
  dateColumns: mockDateColumns,
  availableChartTypes: mockAvailableChartTypes,
  selectedChartType: 'bar',
  onChartTypeChange: action('onChartTypeChange'),
};
