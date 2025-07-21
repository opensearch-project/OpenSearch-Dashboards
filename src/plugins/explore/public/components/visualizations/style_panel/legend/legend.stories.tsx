/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import { LegendOptionsPanel, LegendOptions } from './legend';
import { Positions } from '../../types';

export default {
  component: LegendOptionsPanel,
  title: 'src/plugins/explore/public/components/visualizations/style_panel/legend/legend.tsx',
} as ComponentMeta<typeof LegendOptionsPanel>;

const mockLegend = {
  show: true,
  position: Positions.BOTTOM,
};

const Template: ComponentStory<typeof LegendOptionsPanel> = (args) => {
  const [legend, setLegend] = useState<LegendOptions>(args.legendOptions);

  const handleLegendOptionsChange = (newLegend: Partial<LegendOptions>) => {
    setLegend((prevLegend) => ({
      ...prevLegend,
      ...newLegend,
    }));
    action('onLegendOptionsChange')(newLegend);
  };

  return (
    <div style={{ maxWidth: '800px', padding: '16px' }}>
      <LegendOptionsPanel
        {...args}
        legendOptions={legend}
        onLegendOptionsChange={handleLegendOptionsChange}
      />
    </div>
  );
};

// Primary story
export const Primary = Template.bind({});
Primary.args = {
  legendOptions: mockLegend,
};
