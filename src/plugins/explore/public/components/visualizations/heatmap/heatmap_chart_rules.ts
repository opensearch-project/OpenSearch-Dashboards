/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// import { VisualizationRule } from '../types';
// import { createHeatmapConfig } from './heatmap_vis_config';

// // rule1: 1 Metric & 2 Dimension and If minimum number of unique values in either dimension is ≥ 7
// // rule2: 3 Metrics & 0 Dimension
// export const heatmapChartRule: VisualizationRule = {
//   name: 'heatmap',
//   matches: (numericalColumns, categoricalColumns, dateColumns) => {
//     return (
//       (numericalColumns.length === 3 &&
//         dateColumns.length === 0 &&
//         categoricalColumns.length === 0) ||
//       (numericalColumns.length === 1 && categoricalColumns.length === 2 && dateColumns.length === 0)
//       // &&
//       // Object.keys(categoricalColumns[0]?.groupbyfield || {}).length >= 7)
//     );
//   },
//   createConfig: () => createHeatmapConfig(),
// };
