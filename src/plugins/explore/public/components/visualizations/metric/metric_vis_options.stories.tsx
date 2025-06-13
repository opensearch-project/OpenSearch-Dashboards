/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import { MetricVisStyleControls } from './metric_vis_options';
import { MetricChartStyleControls, defaultMetricChartStyles } from './metric_vis_config';
import { VisColumn, VisFieldType } from '../types';

export default {
  component: MetricVisStyleControls,
  title: 'src/plugins/explore/public/components/visualizations/metric/metric_vis_options',
} as ComponentMeta<typeof MetricVisStyleControls>;

// Mock data for the component props
const mockNumericalColumns: VisColumn[] = [
  { id: 1, name: 'count', schema: VisFieldType.Numerical, column: 'count' },
];

const Template: ComponentStory<typeof MetricVisStyleControls> = (args) => {
  // Use state to track changes
  const [styleOptions, setStyleOptions] = useState<MetricChartStyleControls>(args.styleOptions);

  return (
    <div style={{ maxWidth: '800px', padding: '16px' }}>
      <MetricVisStyleControls
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
  styleOptions: defaultMetricChartStyles,
  numericalColumns: mockNumericalColumns,
};
