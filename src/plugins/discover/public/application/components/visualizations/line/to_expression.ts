/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  buildExpression,
  buildExpressionFunction,
  ExpressionFunctionOpenSearchDashboards,
  IExpressionLoaderParams,
} from '../../../../../../expressions/public';
import { IndexPattern } from '../../../../../../data/public';
import { DiscoverViewServices } from '../../../../build_services';
import { LineChartStyleControls } from './line_vis_config';
import { DiscoverVisColumn } from '../types';

export const toExpression = async (
  services: DiscoverViewServices,
  searchContext: IExpressionLoaderParams['searchContext'],
  indexPattern: IndexPattern,
  transformedData?: Array<Record<string, any>>,
  numericalColumns?: DiscoverVisColumn[],
  categoricalColumns?: DiscoverVisColumn[],
  dateColumns?: DiscoverVisColumn[],
  styleOptions?: Partial<LineChartStyleControls>
) => {
  console.log('line chart', numericalColumns, categoricalColumns, dateColumns);
  if (
    !indexPattern ||
    !searchContext ||
    !JSON.stringify(searchContext.query).toLowerCase().includes('stats') // Empty visualization if query is not aggregated
  ) {
    return '';
  }

  const opensearchDashboards = buildExpressionFunction<ExpressionFunctionOpenSearchDashboards>(
    'opensearchDashboards',
    {}
  );
  const opensearchDashboardsContext = buildExpressionFunction('opensearch_dashboards_context', {
    timeRange: JSON.stringify(searchContext.timeRange || {}),
    filters: JSON.stringify(searchContext.filters || []),
    query: JSON.stringify(searchContext.query || []),
  });

  const vegaSpec = createVegaLineSpec(
    indexPattern,
    transformedData,
    numericalColumns,
    categoricalColumns,
    dateColumns,
    styleOptions
  );

  const vega = buildExpressionFunction<any>('vega', {
    spec: JSON.stringify(vegaSpec),
  });

  return buildExpression([opensearchDashboards, opensearchDashboardsContext, vega]).toString();
};

// Todo: this func needs modification based on the new mapping rules
const createVegaLineSpec = (
  indexPattern: IndexPattern,
  transformedData?: Array<Record<string, any>>,
  numericalColumns?: DiscoverVisColumn[],
  categoricalColumns?: DiscoverVisColumn[],
  dateColumns?: DiscoverVisColumn[],
  styleOptions?: Partial<LineChartStyleControls>
) => {
  console.log('transformedData', transformedData);
  console.log('numericalColumns', numericalColumns);
  console.log('categoricalColumns', categoricalColumns);
  console.log('dateColumns', dateColumns);

  // Todo: revise this to use the new mapping rules

  return newSpec;
};

// // Transform data to a format Vega can use
// const data = rows.map((row: OpenSearchSearchHit) => {
//   const transformedRow: Record<number, any> = {};
//   for (const column of columns) {
//     // Make sure we're consistent with field vs name
//     const fieldName = column.name;
//     transformedRow[column.column] = row._source[fieldName];
//   }
//   return transformedRow;
// });

// // Colors for different lines
// const colors = ['#4C78A8', '#E45756', '#72B7B2', '#F58518', '#54A24B', '#B279A2'];

// // Create a layer for each numeric field
// const layers = numericFields.map((numericField, index) => {
//   const colorIndex = index % colors.length;

//   return {
//     mark: {
//       type: 'line',
//       point: true,
//       tooltip: true,
//       stroke: colors[colorIndex],
//     },
//     encoding: {
//       x: {
//         field: categoryField,
//         type: 'nominal',
//         axis: {
//           // Only first layer needs axis config
//           title: categoryField,
//           labelAngle: -45,
//         },
//       },
//       y: {
//         field: numericField,
//         type: 'quantitative',
//         title: numericField,
//         axis: { title: categoryField }, // Only first layer needs Y-axis
//       },
//       color: {
//         datum: numericField, // Use field name for color legend
//         legend: {
//           title: null,
//         },
//       },
//       tooltip: [
//         { field: categoryField, title: categoryField },
//         { field: numericField, title: numericField },
//       ],
//     },
//   };
// });

// // Create the base Vega spec
// const baseSpec = {
//   $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
//   autosize: { type: 'fit', contains: 'padding' },
//   data: { values: data },
//   layer: layers,
//   config: {
//     axis: {
//       labelFont: 'sans-serif',
//       titleFont: 'sans-serif',
//     },
//     legend: {
//       labelFont: 'sans-serif',
//       titleFont: 'sans-serif',
//     },
//   },
// };

// const newSpec = { ...baseSpec };

// // Apply style options
// if (styleOptions) {
//   if (newSpec.layer) {
//     newSpec.layer = newSpec.layer.map((layer: any) => {
//       if (layer.encoding?.color) {
//         if (!styleOptions.addLegend) {
//           layer.encoding.color.legend = null;
//         } else {
//           layer.encoding.color.legend = {
//             ...layer.encoding.color.legend,
//             orient: styleOptions.legendPosition,
//           };
//         }
//       }
//       return layer;
//     });
//   }
// }

// console.log('vega spec REVISED:', newSpec);
