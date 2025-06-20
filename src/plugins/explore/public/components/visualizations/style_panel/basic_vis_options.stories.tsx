/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import { BasicVisOptions } from './basic_vis_options';

export default {
  component: BasicVisOptions,
  title: 'src/plugins/explore/public/components/visualizations/style_panel/basic_vis_options',
} as ComponentMeta<typeof BasicVisOptions>;

// Template for the story
const Template: ComponentStory<typeof BasicVisOptions> = (args) => {
  // Use state to track changes
  const [addTimeMarker, setAddTimeMarker] = useState<boolean>(args.addTimeMarker);
  const [showLine, setShowLine] = useState<boolean>(args.showLine);
  const [lineMode, setLineMode] = useState<string>(args.lineMode);
  const [lineWidth, setLineWidth] = useState<number>(args.lineWidth);
  const [showDots, setShowDots] = useState<boolean>(args.showDots);

  return (
    <div style={{ maxWidth: '800px', padding: '16px' }}>
      <BasicVisOptions
        {...args}
        addTimeMarker={addTimeMarker}
        showLine={showLine}
        lineMode={lineMode}
        lineWidth={lineWidth}
        showDots={showDots}
        onAddTimeMarkerChange={(value) => {
          setAddTimeMarker(value);
          action('onAddTimeMarkerChange')(value);
        }}
        onShowLineChange={(value) => {
          setShowLine(value);
          action('onShowLineChange')(value);
        }}
        onLineModeChange={(value) => {
          setLineMode(value);
          action('onLineModeChange')(value);
        }}
        onLineWidthChange={(value) => {
          setLineWidth(value);
          action('onLineWidthChange')(value);
        }}
        onShowDotsChange={(value) => {
          setShowDots(value);
          action('onShowDotsChange')(value);
        }}
      />
    </div>
  );
};

// Primary story
export const Primary = Template.bind({});
Primary.args = {
  addTimeMarker: false,
  showLine: true,
  lineMode: 'smooth',
  lineWidth: 2,
  showDots: true,
  onAddTimeMarkerChange: () => {},
  onShowLineChange: () => {},
  onLineModeChange: () => {},
  onLineWidthChange: () => {},
  onShowDotsChange: () => {},
};

// Story with no line
export const NoLine = Template.bind({});
NoLine.args = {
  ...Primary.args,
  showLine: false,
};

// Story with time marker
export const WithTimeMarker = Template.bind({});
WithTimeMarker.args = {
  ...Primary.args,
  addTimeMarker: true,
};
