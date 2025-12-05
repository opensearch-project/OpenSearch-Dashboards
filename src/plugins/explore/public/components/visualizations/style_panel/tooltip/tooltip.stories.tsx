/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import { TooltipOptionsPanel } from './tooltip';
import { TooltipOptions } from '../../types';

export default {
  component: TooltipOptionsPanel,
  title: 'src/plugins/explore/public/components/visualizations/style_panel/tooltip/tooltip.tsx',
} as ComponentMeta<typeof TooltipOptionsPanel>;

const mockTooltip: TooltipOptions = {
  mode: 'all',
};

const Template: ComponentStory<typeof TooltipOptionsPanel> = (args) => {
  const [tooltip, setTooltip] = useState<TooltipOptions>(args.tooltipOptions);

  const handleTooltipOptionsChange = (newTooltip: Partial<TooltipOptions>) => {
    setTooltip((prev) => ({
      ...prev,
      ...newTooltip,
    }));
    action('onTooltipOptionsChange')(newTooltip);
  };

  return (
    <div style={{ maxWidth: '800px', padding: '16px' }}>
      <TooltipOptionsPanel
        tooltipOptions={tooltip}
        onTooltipOptionsChange={handleTooltipOptionsChange}
      />
    </div>
  );
};

// Primary story
export const Primary = Template.bind({});
Primary.args = {
  tooltipOptions: mockTooltip,
};
