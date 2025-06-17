/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import { GeneralVisOptions } from './general_vis_options';
import { Positions } from '../types';

export default {
  component: GeneralVisOptions,
  title: 'src/plugins/explore/public/components/visualizations/style_panel/general_vis_options',
} as ComponentMeta<typeof GeneralVisOptions>;

// Template for the story
const Template: ComponentStory<typeof GeneralVisOptions> = (args) => {
  // Use state to track changes
  const [addTooltip, setAddTooltip] = useState<boolean>(args.addTooltip);
  const [addLegend, setAddLegend] = useState<boolean>(args.addLegend);
  const [legendPosition, setLegendPosition] = useState<Positions>(args.legendPosition);

  return (
    <div style={{ maxWidth: '800px', padding: '16px' }}>
      <GeneralVisOptions
        {...args}
        shouldShowLegend={true}
        addTooltip={addTooltip}
        addLegend={addLegend}
        legendPosition={legendPosition}
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

  onAddTooltipChange: () => {},
  onAddLegendChange: () => {},
  onLegendPositionChange: () => {},
};

// Story with no legend
export const NoLegend = Template.bind({});
NoLegend.args = {
  ...Primary.args,
  addLegend: false,
};
