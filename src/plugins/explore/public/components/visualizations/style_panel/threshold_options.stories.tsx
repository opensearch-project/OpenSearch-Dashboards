/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import { ThresholdOptions } from './threshold_options';
import { ThresholdLine, ThresholdLineStyle } from '../types';

export default {
  component: ThresholdOptions,
  title: 'src/plugins/explore/public/components/visualizations/style_panel/threshold_options',
} as ComponentMeta<typeof ThresholdOptions>;

// Template for the story
const Template: ComponentStory<typeof ThresholdOptions> = (args) => {
  // Use state to track changes
  const [thresholdLine, setThresholdLine] = useState<ThresholdLine>(args.thresholdLine);

  return (
    <div style={{ maxWidth: '800px', padding: '16px' }}>
      <ThresholdOptions
        thresholdLine={thresholdLine}
        onThresholdChange={(newThreshold) => {
          setThresholdLine(newThreshold);
          action('onThresholdChange')(newThreshold);
        }}
      />
    </div>
  );
};

// Primary story - Threshold line shown
export const Primary = Template.bind({});
Primary.args = {
  thresholdLine: {
    color: '#E7664C',
    show: true,
    style: ThresholdLineStyle.Full,
    value: 10,
    width: 2,
  },
};

// Story with threshold line hidden
export const Hidden = Template.bind({});
Hidden.args = {
  thresholdLine: {
    color: '#E7664C',
    show: false,
    style: ThresholdLineStyle.Full,
    value: 10,
    width: 2,
  },
};

// Story with dashed line style
export const DashedLine = Template.bind({});
DashedLine.args = {
  thresholdLine: {
    color: '#E7664C',
    show: true,
    style: ThresholdLineStyle.Dashed,
    value: 10,
    width: 2,
  },
};

// Story with dot-dashed line style
export const DotDashedLine = Template.bind({});
DotDashedLine.args = {
  thresholdLine: {
    color: '#E7664C',
    show: true,
    style: ThresholdLineStyle.DotDashed,
    value: 10,
    width: 2,
  },
};

// Story with thick line
export const ThickLine = Template.bind({});
ThickLine.args = {
  thresholdLine: {
    color: '#E7664C',
    show: true,
    style: ThresholdLineStyle.Full,
    value: 10,
    width: 5,
  },
};

// Story with different color
export const BlueThreshold = Template.bind({});
BlueThreshold.args = {
  thresholdLine: {
    color: '#0077CC',
    show: true,
    style: ThresholdLineStyle.Full,
    value: 10,
    width: 2,
  },
};
