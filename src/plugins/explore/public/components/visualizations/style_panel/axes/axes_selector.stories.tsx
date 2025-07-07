/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import { AxesSelectPanel } from './axes_selector';
import { VisColumn, VisFieldType } from '../../types';

export default {
  component: AxesSelectPanel,
  title: 'src/plugins/explore/public/components/visualizations/style_panel/axes/axes_selector',
} as ComponentMeta<typeof AxesSelectPanel>;

const mockNumericalColumns: VisColumn[] = [
  {
    name: 'sales',
    column: 'sales',
    schema: VisFieldType.Numerical,
    id: 0,
    validValuesCount: 0,
    uniqueValuesCount: 0,
  },
  {
    name: 'profit',
    column: 'profit',
    schema: VisFieldType.Numerical,
    id: 0,
    validValuesCount: 0,
    uniqueValuesCount: 0,
  },
];

const mockCategoricalColumns: VisColumn[] = [
  {
    name: 'category',
    column: 'category',
    schema: VisFieldType.Categorical,
    id: 0,
    validValuesCount: 0,
    uniqueValuesCount: 0,
  },
  {
    name: 'region',
    column: 'region',
    schema: VisFieldType.Categorical,
    id: 0,
    validValuesCount: 0,
    uniqueValuesCount: 0,
  },
];

const mockDateColumns: VisColumn[] = [
  {
    name: 'date',
    column: 'date',
    schema: VisFieldType.Date,
    id: 0,
    validValuesCount: 0,
    uniqueValuesCount: 0,
  },
];

const Template: ComponentStory<typeof AxesSelectPanel> = (args) => {
  return <AxesSelectPanel {...args} />;
};

export const Primary = Template.bind({});
Primary.args = {
  isInitial: true,
  numericalColumns: mockNumericalColumns,
  categoricalColumns: mockCategoricalColumns,
  dateColumns: mockDateColumns,
  updateVisualization: (data) => {
    // console.log(data);
  },
};
