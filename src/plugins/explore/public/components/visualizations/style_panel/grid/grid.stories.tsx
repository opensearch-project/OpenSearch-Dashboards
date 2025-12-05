/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import { GridOptionsPanel } from './grid';
import { GridOptions } from '../../types';

export default {
  component: GridOptionsPanel,
  title: 'src/plugins/explore/public/components/visualizations/style_panel/grid/grid.tsx',
} as ComponentMeta<typeof GridOptionsPanel>;

const mockGrid = {
  xLines: true,
  yLines: false,
};

const Template: ComponentStory<typeof GridOptionsPanel> = (args) => {
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
  grid: mockGrid,
};
