/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { action } from '@storybook/addon-actions';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import { ScatterVisStyleControls } from './scatter_vis_options';
import { defaultScatterChartStyles } from './scatter_vis_config';
import { VisColumn, PointShape, Positions, AxisRole, VisFieldType } from '../types';

export default {
  component: ScatterVisStyleControls,
  title: 'src/plugins/explore/public/components/visualizations/scatter/scatter_vis_options',
} as ComponentMeta<typeof ScatterVisStyleControls>;

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
    name: 'avarage',
    schema: VisFieldType.Numerical,
    column: 'avarage',
    validValuesCount: 1,
    uniqueValuesCount: 1,
  },
];

const mockCategoricalColumns: VisColumn[] = [
  {
    id: 2,
    name: 'category',
    schema: VisFieldType.Categorical,
    column: 'category',
    validValuesCount: 1,
    uniqueValuesCount: 1,
  },
];
const mockDateColumns: VisColumn[] = [];

const Template: ComponentStory<typeof ScatterVisStyleControls> = (args) => {
  // Use state to track changes
  const [styleOptions, setStyleOptions] = useState(args.styleOptions);
  useEffect(() => {
    setStyleOptions(args.styleOptions);
  }, [args.styleOptions]);
  return (
    <div style={{ maxWidth: '800px', padding: '16px' }}>
      <ScatterVisStyleControls
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
  styleOptions: defaultScatterChartStyles,
  numericalColumns: mockNumericalColumns,
  categoricalColumns: mockCategoricalColumns,
  dateColumns: mockDateColumns,
};

export const ScatterExclusive = Template.bind({});
ScatterExclusive.args = {
  styleOptions: {
    ...defaultScatterChartStyles,
    exclusive: {
      pointShape: PointShape.SQUARE,
      filled: true,
      angle: 30,
    },
  },
  numericalColumns: mockNumericalColumns,
  categoricalColumns: mockCategoricalColumns,
  dateColumns: mockDateColumns,
};

const mockThreeNumericalColumns: VisColumn[] = [
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
    name: 'avarage',
    schema: VisFieldType.Numerical,
    column: 'avarage',
    validValuesCount: 1,
    uniqueValuesCount: 1,
  },
  {
    id: 3,
    name: 'min',
    schema: VisFieldType.Numerical,
    column: 'min',
    validValuesCount: 1,
    uniqueValuesCount: 1,
  },
];

export const ScatterWithField = Template.bind({});
ScatterWithField.args = {
  styleOptions: {
    ...defaultScatterChartStyles,
    standardAxes: [
      {
        id: '1',
        position: Positions.RIGHT,
        show: true,
        style: {},
        labels: {
          show: true,
          rotate: 0,
          filter: false,
          truncate: 100,
        },
        title: {
          text: 'Count as new title',
        },
        grid: {
          showLines: true,
        },
        axisRole: AxisRole.X,
      },
      {
        id: '3',
        position: Positions.RIGHT,
        show: true,
        style: {},
        labels: {
          show: true,
          rotate: 0,
          filter: false,
          truncate: 100,
        },
        grid: {
          showLines: true,
        },
        title: {
          text: 'Min as new title',
        },
        axisRole: AxisRole.Y,
      },
    ],
  },
  numericalColumns: mockThreeNumericalColumns,
  categoricalColumns: mockCategoricalColumns,
  dateColumns: mockDateColumns,
};
