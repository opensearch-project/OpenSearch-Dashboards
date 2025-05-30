// /*
//  * Copyright OpenSearch Contributors
//  * SPDX-License-Identifier: Apache-2.0
//  */

// import React, { useState } from 'react';
// import { action } from '@storybook/addon-actions';
// import type { ComponentStory, ComponentMeta } from '@storybook/react';
// import { GridOptions } from './grid_options';
// import { GridOptions as GridConfig } from '../line/line_vis_config';

// export default {
//   component: GridOptions,
//   title:
//     'src/plugins/discover/public/application/components/visualizations/style_panel/grid_options',
// } as ComponentMeta<typeof GridOptions>;

// // Template for the story
// const Template: ComponentStory<typeof GridOptions> = (args) => {
//   // Use state to track changes
//   const [grid, setGrid] = useState<GridConfig>(args.grid);

//   return (
//     <div style={{ maxWidth: '800px', padding: '16px' }}>
//       <GridOptions
//         grid={grid}
//         onGridChange={(newGrid) => {
//           setGrid(newGrid);
//           action('onGridChange')(newGrid);
//         }}
//       />
//     </div>
//   );
// };

// // Primary story
// export const Primary = Template.bind({});
// Primary.args = {
//   grid: {
//     categoryLines: true,
//     valueLines: true,
//   },
// };

// // Story with no category lines
// export const NoCategoryLines = Template.bind({});
// NoCategoryLines.args = {
//   grid: {
//     categoryLines: false,
//     valueLines: true,
//   },
// };

// // Story with no value lines
// export const NoValueLines = Template.bind({});
// NoValueLines.args = {
//   grid: {
//     categoryLines: true,
//     valueLines: false,
//   },
// };

// // Story with no grid lines
// export const NoGridLines = Template.bind({});
// NoGridLines.args = {
//   grid: {
//     categoryLines: false,
//     valueLines: false,
//   },
// };
