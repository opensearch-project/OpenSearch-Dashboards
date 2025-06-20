/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import { HeatmapVisStyleControls } from './heatmap_vis_options';
import { HeatmapChartStyleControls, defaultHeatmapChartStyles } from './heatmap_vis_config';
import { VisColumn, ColorSchemas, ScaleType, VisFieldType } from '../types';

export default {
  component: HeatmapVisStyleControls,
  title: 'src/plugins/explore/public/components/visualizations/heatmap/heatmap_vis_options',
} as ComponentMeta<typeof HeatmapVisStyleControls>;

// Mock data for the component props
const mockNumericalColumns: VisColumn[] = [
  { id: 1, name: 'count', schema: VisFieldType.Numerical, column: 'count' },
];

const mockCategoricalColumns: VisColumn[] = [
  { id: 2, name: 'category', schema: VisFieldType.Categorical, column: 'category' },
  { id: 3, name: 'product', schema: VisFieldType.Categorical, column: 'product' },
];
const mockDateColumns: VisColumn[] = [];

const Template: ComponentStory<typeof HeatmapVisStyleControls> = (args) => {
  // Use state to track changes
  const [styleOptions, setStyleOptions] = useState<HeatmapChartStyleControls>(args.styleOptions);

  return (
    <div style={{ maxWidth: '800px', padding: '16px' }}>
      <HeatmapVisStyleControls
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
  styleOptions: defaultHeatmapChartStyles,
  numericalColumns: mockNumericalColumns,
  categoricalColumns: mockCategoricalColumns,
  dateColumns: mockDateColumns,
};

export const ShowLabel = Template.bind({});
ShowLabel.args = {
  styleOptions: {
    ...defaultHeatmapChartStyles,
    label: {
      show: true,
      rotate: true,
      overwriteColor: false,
      color: 'black',
    },
  },
  numericalColumns: mockNumericalColumns,
  categoricalColumns: mockCategoricalColumns,
  dateColumns: mockDateColumns,
};

export const ExclusiveHeatmap = Template.bind({});
ExclusiveHeatmap.args = {
  styleOptions: {
    ...defaultHeatmapChartStyles,
    exclusive: {
      ...defaultHeatmapChartStyles.exclusive,
      colorSchema: ColorSchemas.GREENBLUE,
      reverseSchema: true,
      colorScaleType: ScaleType.LOG,
      useCustomRanges: true,
    },
  },
  numericalColumns: mockNumericalColumns,
  categoricalColumns: mockCategoricalColumns,
  dateColumns: mockDateColumns,
};

const mockThreeNumericalColumns: VisColumn[] = [
  { id: 1, name: 'count', schema: VisFieldType.Numerical, column: 'count' },
  { id: 2, name: 'avarage', schema: VisFieldType.Numerical, column: 'avarage' },
  { id: 3, name: 'min', schema: VisFieldType.Numerical, column: 'min' },
];

export const HeatmapWithThreeNumericalColumns = Template.bind({});
HeatmapWithThreeNumericalColumns.args = {
  styleOptions: defaultHeatmapChartStyles,
  numericalColumns: mockThreeNumericalColumns,
  categoricalColumns: mockCategoricalColumns,
  dateColumns: mockDateColumns,
};
