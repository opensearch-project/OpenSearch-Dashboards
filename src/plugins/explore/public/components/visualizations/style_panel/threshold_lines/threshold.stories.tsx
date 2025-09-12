/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import { ThresholdOptions } from './threshold';
import { ThresholdLines, ThresholdLineStyle } from '../../types';

export default {
  component: ThresholdOptions,
  title:
    'src/plugins/explore/public/components/visualizations/style_panel/threshold_lines/threshold.tsx',
} as ComponentMeta<typeof ThresholdOptions>;

const mockThreshold = [
  {
    id: '1',
    color: '#54B399',
    show: true,
    style: ThresholdLineStyle.DotDashed,
    value: 50,
    width: 1,
    name: 'Threshold 1',
  },
];

const Template: ComponentStory<typeof ThresholdOptions> = (args) => {
  const [threshold, setThreshold] = useState<ThresholdLines>(args.thresholdLines);

  const handleThresholdOptionsChange = (newThreshold: ThresholdLines) => {
    setThreshold(newThreshold);
    action('onThresholdLinesChange')(newThreshold);
  };

  return (
    <div style={{ maxWidth: '800px', padding: '16px' }}>
      <ThresholdOptions
        {...args}
        thresholdLines={threshold}
        onThresholdLinesChange={handleThresholdOptionsChange}
      />
    </div>
  );
};

// Primary story
export const Primary = Template.bind({});
Primary.args = {
  thresholdLines: mockThreshold,
};
