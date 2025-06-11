/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { action } from '@storybook/addon-actions';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import { ScatterVisStyleControls } from './scatter_vis_options';
import { ScatterChartStyleControls, defaultScatterChartStyles } from './scatter_vis_config';
import { DiscoverVisColumn, PointShape, AxisPosition, AxisRole } from '../types';

export default {
  component: ScatterVisStyleControls,
  title:
    'src/plugins/discover/public/application/components/visualizations/scatter/scatter_vis_options',
} as ComponentMeta<typeof ScatterVisStyleControls>;

// Mock data for the component props
const mockNumericalColumns: DiscoverVisColumn[] = [
  { id: 1, name: 'count', schema: 'numerical', column: 'count' },
  { id: 2, name: 'avarage', schema: 'numerical', column: 'avarage' },
];

const mockCategoricalColumns: DiscoverVisColumn[] = [
  { id: 2, name: 'category', schema: 'categorical', column: 'category' },
];
const mockDateColumns: DiscoverVisColumn[] = [];

const Template: ComponentStory<typeof ScatterVisStyleControls> = (args) => {
  // Use state to track changes
  const [styleOptions, setStyleOptions] = useState<ScatterChartStyleControls>(args.styleOptions);
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

const mockThreeNumericalColumns: DiscoverVisColumn[] = [
  { id: 1, name: 'count', schema: 'numerical', column: 'count' },
  { id: 2, name: 'avarage', schema: 'numerical', column: 'avarage' },
  { id: 3, name: 'min', schema: 'numerical', column: 'min' },
];

export const ScatterWithField = Template.bind({});
ScatterWithField.args = {
  styleOptions: {
    ...defaultScatterChartStyles,
    StandardAxes: [
      {
        id: '1',
        position: AxisPosition.RIGHT,
        field: {
          default: mockThreeNumericalColumns[1],
          options: mockThreeNumericalColumns,
        },
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
        grid: { showLines: true },
        axisRole: AxisRole.X,
      },
      {
        id: '3',
        position: AxisPosition.RIGHT,
        field: {
          default: mockThreeNumericalColumns[2],
          options: mockThreeNumericalColumns,
        },
        show: true,
        style: {},
        labels: {
          show: true,
          rotate: 0,
          filter: false,
          truncate: 100,
        },
        title: {
          text: 'Min as new title',
        },
        grid: { showLines: true },
        axisRole: AxisRole.Y,
      },
    ],
  },
  numericalColumns: mockThreeNumericalColumns,
  categoricalColumns: mockCategoricalColumns,
  dateColumns: mockDateColumns,
};
