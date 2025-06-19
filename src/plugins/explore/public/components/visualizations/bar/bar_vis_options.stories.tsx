/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import { BarVisStyleControls } from './bar_vis_options';
import { BarChartStyleControls, defaultBarChartStyles } from './bar_vis_config';
import { VisColumn, VisFieldType } from '../types';

export default {
  component: BarVisStyleControls,
  title: 'src/plugins/explore/public/components/visualizations/bar/bar_vis_options',
} as ComponentMeta<typeof BarVisStyleControls>;

// Mock data for the component props
const mockNumericalColumns: VisColumn[] = [
  {
    id: 1,
    name: 'Count',
    schema: VisFieldType.Numerical,
    column: 'count',
    validValuesCount: 100,
    uniqueValuesCount: 50,
  },
];

const mockCategoricalColumns: VisColumn[] = [
  {
    id: 2,
    name: 'Category',
    schema: VisFieldType.Categorical,
    column: 'category',
    validValuesCount: 100,
    uniqueValuesCount: 10,
  },
];

const mockDateColumns: VisColumn[] = [];

const Template: ComponentStory<typeof BarVisStyleControls> = (args) => {
  // Use state to track changes
  const [styleOptions, setStyleOptions] = useState<BarChartStyleControls>(args.styleOptions);

  return (
    <div style={{ maxWidth: '800px', padding: '16px' }}>
      <BarVisStyleControls
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

export const Primary = Template.bind({});
Primary.args = {
  styleOptions: defaultBarChartStyles,
  numericalColumns: mockNumericalColumns,
  categoricalColumns: mockCategoricalColumns,
  dateColumns: mockDateColumns,
};

export const WithMultipleColumns = Template.bind({});
WithMultipleColumns.args = {
  styleOptions: defaultBarChartStyles,
  numericalColumns: [
    ...mockNumericalColumns,
    {
      id: 3,
      name: 'Sum',
      schema: VisFieldType.Numerical,
      column: 'sum',
      validValuesCount: 100,
      uniqueValuesCount: 50,
    },
  ],
  categoricalColumns: [
    ...mockCategoricalColumns,
    {
      id: 4,
      name: 'Category2',
      schema: VisFieldType.Categorical,
      column: 'category2',
      validValuesCount: 100,
      uniqueValuesCount: 10,
    },
  ],
  dateColumns: mockDateColumns,
};

export const WithCustomStyles = Template.bind({});
WithCustomStyles.args = {
  styleOptions: {
    ...defaultBarChartStyles,
    addTooltip: false,
    addLegend: false,
    barWidth: 0.5,
    barPadding: 0.2,
    showBarBorder: true,
    barBorderWidth: 2,
    barBorderColor: '#FF0000',
    thresholdLine: {
      ...defaultBarChartStyles.thresholdLine,
      show: true,
      value: 15,
      color: '#00FF00',
      width: 2,
    },
    grid: {
      categoryLines: false,
      valueLines: true,
    },
  },
  numericalColumns: mockNumericalColumns,
  categoricalColumns: mockCategoricalColumns,
  dateColumns: mockDateColumns,
};

export const WithCustomAxes = Template.bind({});
WithCustomAxes.args = {
  styleOptions: {
    ...defaultBarChartStyles,
    categoryAxes: [
      {
        ...defaultBarChartStyles.categoryAxes[0],
        title: {
          text: 'Custom Category Axis',
        },
        labels: {
          ...defaultBarChartStyles.categoryAxes[0].labels,
          rotate: 45,
        },
      },
    ],
    valueAxes: [
      {
        ...defaultBarChartStyles.valueAxes[0],
        title: {
          text: 'Custom Value Axis',
        },
      },
    ],
  },
  numericalColumns: mockNumericalColumns,
  categoricalColumns: mockCategoricalColumns,
  dateColumns: mockDateColumns,
};
