/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import { BasicVisOptions } from './basic_vis_options';
import { Positions } from '../utils/collections';

export default {
  component: BasicVisOptions,
  title: 'src/plugins/explore/public/components/visualizations/style_panel/basic_vis_options',
} as ComponentMeta<typeof BasicVisOptions>;

// Template for the story
const Template: ComponentStory<typeof BasicVisOptions> = (args) => {
  // Use state to track changes
  const [addTooltip, setAddTooltip] = useState<boolean>(args.addTooltip);
  const [addLegend, setAddLegend] = useState<boolean>(args.addLegend);
  const [legendPosition, setLegendPosition] = useState<string>(args.legendPosition);
  const [addTimeMarker, setAddTimeMarker] = useState<boolean>(args.addTimeMarker);
  const [showLine, setShowLine] = useState<boolean>(args.showLine);
  const [lineMode, setLineMode] = useState<string>(args.lineMode);
  const [lineWidth, setLineWidth] = useState<number>(args.lineWidth);
  const [showDots, setShowDots] = useState<boolean>(args.showDots);

  return (
    <div style={{ maxWidth: '800px', padding: '16px' }}>
      <BasicVisOptions
        {...args}
        addTooltip={addTooltip}
        addLegend={addLegend}
        legendPosition={legendPosition}
        addTimeMarker={addTimeMarker}
        showLine={showLine}
        lineMode={lineMode}
        lineWidth={lineWidth}
        showDots={showDots}
        onAddTooltipChange={(value) => {
          setAddTooltip(value);
          action('onAddTooltipChange')(value);
        }}
        onAddLegendChange={(value) => {
          setAddLegend(value);
          action('onAddLegendChange')(value);
        }}
        onLegendPositionChange={(value) => {
          setLegendPosition(value);
          action('onLegendPositionChange')(value);
        }}
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
  addTooltip: true,
  addLegend: true,
  legendPosition: Positions.RIGHT,
  addTimeMarker: false,
  showLine: true,
  lineMode: 'smooth',
  lineWidth: 2,
  showDots: true,
  onAddTooltipChange: () => {},
  onAddLegendChange: () => {},
  onLegendPositionChange: () => {},
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

// Story with no legend
export const NoLegend = Template.bind({});
NoLegend.args = {
  ...Primary.args,
  addLegend: false,
};

// Story with time marker
export const WithTimeMarker = Template.bind({});
WithTimeMarker.args = {
  ...Primary.args,
  addTimeMarker: true,
};
