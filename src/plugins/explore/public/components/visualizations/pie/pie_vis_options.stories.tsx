/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import { PieVisStyleControls } from './pie_vis_options';
import { PieChartStyleControls, defaultPieChartStyles } from './pie_vis_config';
import { VisColumn, VisFieldType } from '../types';

export default {
  component: PieVisStyleControls,
  title: 'src/plugins/explore/public/components/visualizations/pie/pie_vis_options',
} as ComponentMeta<typeof PieVisStyleControls>;

// Mock data for the component props
const mockNumericalColumns: VisColumn[] = [
  { id: 1, name: 'count', schema: VisFieldType.Numerical, column: 'count' },
];

const mockCategoricalColumns: VisColumn[] = [
  { id: 2, name: 'category', schema: VisFieldType.Categorical, column: 'category' },
];
const mockDateColumns: VisColumn[] = [];

const Template: ComponentStory<typeof PieVisStyleControls> = (args) => {
  // Use state to track changes
  const [styleOptions, setStyleOptions] = useState<PieChartStyleControls>(args.styleOptions);

  return (
    <div style={{ maxWidth: '800px', padding: '16px' }}>
      <PieVisStyleControls
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
  styleOptions: defaultPieChartStyles,
  numericalColumns: mockNumericalColumns,
  categoricalColumns: mockCategoricalColumns,
  dateColumns: mockDateColumns,
};

export const CloseAll = Template.bind({});
CloseAll.args = {
  styleOptions: {
    ...defaultPieChartStyles,
    addTooltip: false,
    addLegend: false,
    exclusive: {
      donut: false,
      showValues: false,
      showLabels: false,
      truncate: 100,
    },
  },
  numericalColumns: mockNumericalColumns,
  categoricalColumns: mockCategoricalColumns,
  dateColumns: mockDateColumns,
};
