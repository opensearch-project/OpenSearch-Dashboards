/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import { LineExclusiveVisOptions } from './line_exclusive_vis_options';
import { LineStyle } from './line_vis_config';

export default {
  component: LineExclusiveVisOptions,
  title: 'src/plugins/explore/public/components/visualizations/line/line_exclusive_vis_options',
} as ComponentMeta<typeof LineExclusiveVisOptions>;

// Template for the story
const Template: ComponentStory<typeof LineExclusiveVisOptions> = (args) => {
  // Use state to track changes
  const [addTimeMarker, setAddTimeMarker] = useState<boolean>(args.addTimeMarker);
  const [lineStyle, setLineStyle] = useState<LineStyle>(args.lineStyle);
  const [lineMode, setLineMode] = useState<string>(args.lineMode);
  const [lineWidth, setLineWidth] = useState<number>(args.lineWidth);

  return (
    <div style={{ maxWidth: '800px', padding: '16px' }}>
      <LineExclusiveVisOptions
        {...args}
        addTimeMarker={addTimeMarker}
        lineStyle={lineStyle}
        lineMode={lineMode}
        lineWidth={lineWidth}
        onAddTimeMarkerChange={(value) => {
          setAddTimeMarker(value);
          action('onAddTimeMarkerChange')(value);
        }}
        onLineStyleChange={(value) => {
          setLineStyle(value);
          action('onLineStyleChange')(value);
        }}
        onLineModeChange={(value) => {
          setLineMode(value);
          action('onLineModeChange')(value);
        }}
        onLineWidthChange={(value) => {
          setLineWidth(value);
          action('onLineWidthChange')(value);
        }}
      />
    </div>
  );
};

// Primary story
export const Primary = Template.bind({});
Primary.args = {
  addTimeMarker: false,
  lineStyle: 'both' as LineStyle,
  lineMode: 'smooth',
  lineWidth: 2,
  onAddTimeMarkerChange: () => {},
  onLineStyleChange: () => {},
  onLineModeChange: () => {},
  onLineWidthChange: () => {},
};

// Story with line only
export const LineOnly = Template.bind({});
LineOnly.args = {
  ...Primary.args,
  lineStyle: 'line' as LineStyle,
};

// Story with dots only
export const DotsOnly = Template.bind({});
DotsOnly.args = {
  ...Primary.args,
  lineStyle: 'dots' as LineStyle,
};

// Story with time marker
export const WithTimeMarker = Template.bind({});
WithTimeMarker.args = {
  ...Primary.args,
  addTimeMarker: true,
};
