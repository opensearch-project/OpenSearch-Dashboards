/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import { AxesOptions } from './axes_options';
import { CategoryAxis, VisColumn, ValueAxis, VisFieldType } from '../types';
import { Positions } from '../utils/collections';

export default {
  component: AxesOptions,
  title: 'src/plugins/explore/public/components/visualizations/style_panel/axes_options',
} as ComponentMeta<typeof AxesOptions>;

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

const mockCategoryAxes: CategoryAxis[] = [
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
];

const mockValueAxes: ValueAxis[] = [
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
];

// Template for the story
const Template: ComponentStory<typeof AxesOptions> = (args) => {
  // Use state to track changes to the axes
  const [categoryAxes, setCategoryAxes] = useState<CategoryAxis[]>(args.categoryAxes);
  const [valueAxes, setValueAxes] = useState<ValueAxis[]>(args.valueAxes);

  return (
    <div style={{ maxWidth: '800px', padding: '16px' }}>
      <AxesOptions
        {...args}
        categoryAxes={categoryAxes}
        valueAxes={valueAxes}
        onCategoryAxesChange={(newCategoryAxes) => {
          setCategoryAxes(newCategoryAxes);
          action('onCategoryAxesChange')(newCategoryAxes);
        }}
        onValueAxesChange={(newValueAxes) => {
          setValueAxes(newValueAxes);
          action('onValueAxesChange')(newValueAxes);
        }}
      />
    </div>
  );
};

// Primary story
export const Primary = Template.bind({});
Primary.args = {
  categoryAxes: mockCategoryAxes,
  valueAxes: mockValueAxes,
  numericalColumns: mockNumericalColumns,
  categoricalColumns: mockCategoricalColumns,
  dateColumns: mockDateColumns,
};

// Story with multiple value axes
export const MultipleValueAxes = Template.bind({});
MultipleValueAxes.args = {
  categoryAxes: mockCategoryAxes,
  valueAxes: [
    ...mockValueAxes,
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
  numericalColumns: mockNumericalColumns,
  categoricalColumns: mockCategoricalColumns,
  dateColumns: mockDateColumns,
};

// Story for Rule 2 scenario (2 metrics, 1 date, 0 categories) with left and right axes
export const Rule2Scenario = Template.bind({});
Rule2Scenario.args = {
  categoryAxes: mockCategoryAxes,
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
        truncate: 100,
        filter: false,
      },
      title: {
        text: 'Bar Chart Metric',
      },
    },
    {
      id: 'ValueAxis-2',
      name: 'RightAxis-1',
      type: 'value',
      position: Positions.RIGHT,
      show: true,
      labels: {
        show: true,
        rotate: 0,
        truncate: 100,
        filter: false,
      },
      title: {
        text: 'Line Chart Metric',
      },
    },
  ],
  numericalColumns: [
    { id: 1, name: 'Bar Chart Metric', schema: VisFieldType.Numerical, column: 'count' },
    { id: 2, name: 'Line Chart Metric', schema: VisFieldType.Numerical, column: 'price' },
  ],
  categoricalColumns: [],
  dateColumns: mockDateColumns,
};

// Story with rotated labels
export const RotatedLabels = Template.bind({});
RotatedLabels.args = {
  categoryAxes: [
    {
      ...mockCategoryAxes[0],
      labels: {
        ...mockCategoryAxes[0].labels,
        rotate: -45,
      },
    },
  ],
  valueAxes: mockValueAxes,
  numericalColumns: mockNumericalColumns,
  categoricalColumns: mockCategoricalColumns,
  dateColumns: mockDateColumns,
};
