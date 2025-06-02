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
import { DiscoverVisColumn } from '../types';

export default {
  component: LineVisStyleControls,
  title: 'src/plugins/discover/public/application/components/visualizations/line/line_vis_options',
} as ComponentMeta<typeof LineVisStyleControls>;

// Mock data for the component props
const mockNumericalColumns: DiscoverVisColumn[] = [
  { id: 1, name: 'count', schema: 'numerical', column: 'count' },
  { id: 2, name: 'price', schema: 'numerical', column: 'price' },
  { id: 3, name: 'revenue', schema: 'numerical', column: 'revenue' },
];

const mockCategoricalColumns: DiscoverVisColumn[] = [
  { id: 4, name: 'category', schema: 'categorical', column: 'category' },
  { id: 5, name: 'product', schema: 'categorical', column: 'product' },
];

const mockDateColumns: DiscoverVisColumn[] = [
  { id: 6, name: 'timestamp', schema: 'date', column: 'timestamp' },
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
    style: 'full',
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
      position: 'bottom',
      show: true,
      style: {},
      scale: {
        type: 'linear',
      },
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
      position: 'left',
      show: true,
      style: {},
      scale: {
        type: 'linear',
        mode: 'normal',
        defaultYExtents: false,
        setYExtents: false,
      },
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
  const [styleOptions, setStyleOptions] = useState<Partial<LineChartStyleControls>>(
    args.styleOptions
  );

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
        position: 'right',
        show: true,
        style: {},
        scale: {
          type: 'linear',
          mode: 'normal',
          defaultYExtents: false,
          setYExtents: false,
        },
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
