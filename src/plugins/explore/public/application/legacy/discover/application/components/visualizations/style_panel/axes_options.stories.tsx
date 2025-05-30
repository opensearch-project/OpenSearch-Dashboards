/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import { AxesOptions } from './axes_options';
import { CategoryAxis, ValueAxis } from '../line/line_vis_config';
import { ExploreVisColumn } from '../types';

export default {
  component: AxesOptions,
  title:
    'src/plugins/explore/public/application/legacy/discover/application/components/visualizations/style_panel/axes_options',
} as ComponentMeta<typeof AxesOptions>;

// Mock data for the component props
const mockNumericalColumns: ExploreVisColumn[] = [
  { id: 1, name: 'count', schema: 'numerical', column: 'count' },
  { id: 2, name: 'price', schema: 'numerical', column: 'price' },
  { id: 3, name: 'revenue', schema: 'numerical', column: 'revenue' },
];

const mockCategoricalColumns: ExploreVisColumn[] = [
  { id: 4, name: 'category', schema: 'categorical', column: 'category' },
  { id: 5, name: 'product', schema: 'categorical', column: 'product' },
];

const mockDateColumns: ExploreVisColumn[] = [
  { id: 6, name: 'timestamp', schema: 'date', column: 'timestamp' },
];

const mockCategoryAxes: CategoryAxis[] = [
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
];

const mockValueAxes: ValueAxis[] = [
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
  numericalColumns: mockNumericalColumns,
  categoricalColumns: mockCategoricalColumns,
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
