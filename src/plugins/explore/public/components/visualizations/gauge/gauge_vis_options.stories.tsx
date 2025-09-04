/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import { GaugeVisStyleControls } from './gauge_vis_options';
import { GaugeChartStyleControls, defaultGaugeChartStyles } from './gauge_vis_config';
import { VisColumn, VisFieldType } from '../types';

export default {
  component: GaugeVisStyleControls,
  title: 'src/plugins/explore/public/components/visualizations/gauge/gauge_vis_options.tsx',
} as ComponentMeta<typeof GaugeVisStyleControls>;

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
];

const Template: ComponentStory<typeof GaugeVisStyleControls> = (args) => {
  // Use state to track changes
  const [styleOptions, setStyleOptions] = useState<GaugeChartStyleControls>(args.styleOptions);

  return (
    <div style={{ maxWidth: '800px', padding: '16px' }}>
      <GaugeVisStyleControls
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
  styleOptions: defaultGaugeChartStyles,
  numericalColumns: mockNumericalColumns,
};
