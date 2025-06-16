/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import { GridOptionsPanel } from './grid_options';
import { GridOptions } from '../types';

export default {
  component: GridOptionsPanel,
  title: 'src/plugins/explore/public/components/visualizations/style_panel/grid_options',
} as ComponentMeta<typeof GridOptionsPanel>;

// Template for the story
const Template: ComponentStory<typeof GridOptionsPanel> = (args) => {
  // Use state to track changes
  const [grid, setGrid] = useState<GridOptions>(args.grid);

  return (
    <div style={{ maxWidth: '800px', padding: '16px' }}>
      <GridOptionsPanel
        grid={grid}
        onGridChange={(newGrid) => {
          setGrid(newGrid);
          action('onGridChange')(newGrid);
        }}
      />
    </div>
  );
};

// Primary story
export const Primary = Template.bind({});
Primary.args = {
  grid: {
    categoryLines: true,
    valueLines: true,
  },
};

// Story with no category lines
export const NoCategoryLines = Template.bind({});
NoCategoryLines.args = {
  grid: {
    categoryLines: false,
    valueLines: true,
  },
};

// Story with no value lines
export const NoValueLines = Template.bind({});
NoValueLines.args = {
  grid: {
    categoryLines: true,
    valueLines: false,
  },
};

// Story with no grid lines
export const NoGridLines = Template.bind({});
NoGridLines.args = {
  grid: {
    categoryLines: false,
    valueLines: false,
  },
};
