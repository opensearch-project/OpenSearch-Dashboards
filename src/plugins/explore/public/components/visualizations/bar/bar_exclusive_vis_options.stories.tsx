/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import { BarExclusiveVisOptions } from './bar_exclusive_vis_options';

export default {
  component: BarExclusiveVisOptions,
  title: 'src/plugins/explore/public/components/visualizations/bar/bar_exclusive_vis_options',
} as ComponentMeta<typeof BarExclusiveVisOptions>;

const Template: ComponentStory<typeof BarExclusiveVisOptions> = (args) => {
  // Use state to track changes
  const [barWidth, setBarWidth] = useState<number>(args.barWidth);
  const [barPadding, setBarPadding] = useState<number>(args.barPadding);
  const [showBarBorder, setShowBarBorder] = useState<boolean>(args.showBarBorder);
  const [barBorderWidth, setBarBorderWidth] = useState<number>(args.barBorderWidth);
  const [barBorderColor, setBarBorderColor] = useState<string>(args.barBorderColor);

  return (
    <div style={{ maxWidth: '800px', padding: '16px' }}>
      <BarExclusiveVisOptions
        {...args}
        barWidth={barWidth}
        barPadding={barPadding}
        showBarBorder={showBarBorder}
        barBorderWidth={barBorderWidth}
        barBorderColor={barBorderColor}
        onBarWidthChange={(value) => {
          setBarWidth(value);
          action('onBarWidthChange')(value);
        }}
        onBarPaddingChange={(value) => {
          setBarPadding(value);
          action('onBarPaddingChange')(value);
        }}
        onShowBarBorderChange={(value) => {
          setShowBarBorder(value);
          action('onShowBarBorderChange')(value);
        }}
        onBarBorderWidthChange={(value) => {
          setBarBorderWidth(value);
          action('onBarBorderWidthChange')(value);
        }}
        onBarBorderColorChange={(value) => {
          setBarBorderColor(value);
          action('onBarBorderColorChange')(value);
        }}
      />
    </div>
  );
};

export const Default = Template.bind({});
Default.args = {
  barWidth: 0.7,
  barPadding: 0.1,
  showBarBorder: false,
  barBorderWidth: 1,
  barBorderColor: '#000000',
};

export const WithBorder = Template.bind({});
WithBorder.args = {
  barWidth: 0.7,
  barPadding: 0.1,
  showBarBorder: true,
  barBorderWidth: 2,
  barBorderColor: '#FF0000',
};

export const CustomSettings = Template.bind({});
CustomSettings.args = {
  barWidth: 0.5,
  barPadding: 0.2,
  showBarBorder: true,
  barBorderWidth: 3,
  barBorderColor: '#00FF00',
};
