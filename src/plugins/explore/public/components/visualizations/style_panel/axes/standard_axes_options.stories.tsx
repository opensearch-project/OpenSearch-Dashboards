/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import { AllAxesOptions } from './standard_axes_options';
import {
  VisColumn,
  StandardAxes,
  Positions,
  AxisRole,
  VisFieldType,
  AxisColumnMappings,
} from '../../types';

export default {
  component: AllAxesOptions,
  title:
    'src/plugins/explore/public/components/visualizations/style_panel/axes/standard_axes_options.tsx',
} as ComponentMeta<typeof AllAxesOptions>;

// Mock data for the component props
const mockNumericalColumns: VisColumn[] = [
  {
    id: 1,
    name: 'count',
    schema: VisFieldType.Numerical,
    column: 'count',
    validValuesCount: 1,
    uniqueValuesCount: 1,
  },
  {
    id: 2,
    name: 'price',
    schema: VisFieldType.Numerical,
    column: 'price',
    validValuesCount: 1,
    uniqueValuesCount: 1,
  },
  {
    id: 3,
    name: 'revenue',
    schema: VisFieldType.Numerical,
    column: 'revenue',
    validValuesCount: 1,
    uniqueValuesCount: 1,
  },
];

const mockAxisColumnMappings: AxisColumnMappings = {
  x: {
    id: 1,
    schema: VisFieldType.Categorical,
    name: 'OriginCityName',
    column: 'field-1',
    validValuesCount: 1,
    uniqueValuesCount: 1,
  },
  y: {
    id: 0,
    schema: VisFieldType.Numerical,
    name: 'num_flights',
    column: 'field-0',
    validValuesCount: 1,
    uniqueValuesCount: 1,
  },
};

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
      showLines: true,
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
      showLines: true,
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
        onStandardAxesChange={(axes) => {
          setStandardAxes(axes);
          action('onStandardAxesChange')(axes);
        }}
      />
    </div>
  );
};

// Primary story
export const Primary = Template.bind({});
Primary.args = {
  standardAxes: mockStandardAxes,
  axisColumnMappings: {},
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
  axisColumnMappings: mockAxisColumnMappings,
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
  axisColumnMappings: mockAxisColumnMappings,
};
