/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import { LineVisStyleControls } from './line_vis_options';
import { LineChartStyleControls } from './line_vis_config';
import { Positions } from '../utils/collections';
import { ThresholdLineStyle, VisColumn, VisFieldType } from '../types';

export default {
  component: LineVisStyleControls,
  title: 'src/plugins/explore/public/components/visualizations/line/line_vis_options',
} as ComponentMeta<typeof LineVisStyleControls>;

// Mock data for the component props
const mockNumericalColumns: VisColumn[] = [
  { id: 1, name: 'count', schema: VisFieldType.Numerical, column: 'count' },
  { id: 2, name: 'price', schema: VisFieldType.Numerical, column: 'price' },
  { id: 3, name: 'revenue', schema: VisFieldType.Numerical, column: 'revenue' },
];

const mockCategoricalColumns: VisColumn[] = [
  { id: 4, name: 'category', schema: VisFieldType.Categorical, column: 'category' },
  { id: 5, name: 'product', schema: VisFieldType.Categorical, column: 'product' },
];

const mockDateColumns: VisColumn[] = [
  { id: 6, name: 'timestamp', schema: VisFieldType.Date, column: 'timestamp' },
];

// Default style options
const defaultStyleOptions: LineChartStyleControls = {
  // Basic controls
  addTooltip: true,
  addLegend: true,
  legendPosition: Positions.RIGHT,
  addTimeMarker: false,

  showLine: true,
  lineMode: 'smooth',
  lineWidth: 2,
  showDots: true,

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
};

// Story with multiple value axes
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
};

// Story with no grid lines
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
};
