/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import { AllAxesOptions } from './standard_axes_options';
import { VisColumn, StandardAxes, Positions, AxisRole, VisFieldType } from '../types';

export default {
  component: AllAxesOptions,
  title: 'src/plugins/explore/public/components/visualizations/style_panel/standard_axes_options',
} as ComponentMeta<typeof AllAxesOptions>;

// Mock data for the component props
const mockNumericalColumns: VisColumn[] = [
  { id: 1, name: 'count', schema: VisFieldType.Numerical, column: 'count' },
  { id: 2, name: 'price', schema: VisFieldType.Numerical, column: 'price' },
  { id: 3, name: 'revenue', schema: VisFieldType.Numerical, column: 'revenue' },
];

const mockStandardAxes: StandardAxes[] = [
  {
    id: 'Axis-1',
    position: Positions.LEFT,
    show: true,
    style: {},
    labels: {
      show: true,
      rotate: 0,
      filter: false,
      truncate: 100,
    },
    title: {
      text: '',
    },
    grid: {
      showLines: false,
    },
    axisRole: AxisRole.Y,
  },
  {
    id: 'Axis-2',
    position: Positions.BOTTOM,
    show: true,
    style: {},
    labels: {
      show: true,
      rotate: 0,
      filter: false,
      truncate: 100,
    },
    title: {
      text: '',
    },
    grid: {
      showLines: false,
    },
    axisRole: AxisRole.X,
  },
];

// Template for the story
const Template: ComponentStory<typeof AllAxesOptions> = (args) => {
  // Use state to track changes to the axes
  const [standardAxes, setStandardAxes] = useState<StandardAxes[]>(args.standardAxes);

  return (
    <div style={{ maxWidth: '800px', padding: '16px' }}>
      <AllAxesOptions
        {...args}
        standardAxes={standardAxes}
        disableGrid={true}
        onStandardAxesChange={(axes) => {
          setStandardAxes(axes);
          action('onStandardAxesChange')(axes);
        }}
        onChangeSwitchAxes={(prevAxes) => {
          const switched = prevAxes.map((axis) =>
            axis.axisRole === AxisRole.X
              ? { ...axis, axisRole: AxisRole.Y }
              : { ...axis, axisRole: AxisRole.X }
          );
          setStandardAxes(switched);
        }}
      />
    </div>
  );
};

// Primary story
export const Primary = Template.bind({});
Primary.args = {
  standardAxes: mockStandardAxes,
};

export const AxesWithField = Template.bind({});
AxesWithField.args = {
  standardAxes: [
    {
      ...mockStandardAxes[0],
      field: {
        default: mockNumericalColumns[2],
        options: mockNumericalColumns,
      },
    },
  ],
};

// Story with rotated labels
export const RotatedLabels = Template.bind({});
RotatedLabels.args = {
  standardAxes: [
    {
      ...mockStandardAxes[0],
      labels: {
        ...mockStandardAxes[0].labels,
        rotate: -45,
      },
    },
  ],
};
