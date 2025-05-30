// /*
//  * Copyright OpenSearch Contributors
//  * SPDX-License-Identifier: Apache-2.0
//  */

// import React from 'react';
// import type { ComponentStory, ComponentMeta } from '@storybook/react';
// import { DiscoverVisualization } from './discover_visualization';
// import { Positions } from './utils/collections';
// import { DiscoverVisColumn } from './types';
// import { LineChartStyleControls } from './line/line_vis_config';
// import { OpenSearchSearchHit } from '../../doc_views/doc_views_types';
// import { IFieldType } from '../../../opensearch_dashboards_services';

// // Mock the required hooks and services
// jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
//   useOpenSearchDashboards: () => ({
//     services: {
//       data: {
//         query: {
//           filterManager: {
//             getFilters: () => [],
//           },
//           queryString: {
//             getQuery: () => ({ language: 'kuery', query: '' }),
//             getLanguageService: () => ({
//               getLanguage: () => ({
//                 showVisualization: true,
//               }),
//             }),
//           },
//           timefilter: {
//             timefilter: {
//               getTime: () => ({
//                 from: 'now-15m',
//                 to: 'now',
//               }),
//             },
//           },
//           state$: {
//             subscribe: () => ({
//               unsubscribe: () => {},
//             }),
//           },
//         },
//       },
//       expressions: {
//         ReactExpressionRenderer: (props: any) => (
//           <div data-test-subj="mockExpressionRenderer">
//             <div>Expression Renderer Mock</div>
//             <pre>{JSON.stringify(props, null, 2)}</pre>
//           </div>
//         ),
//       },
//     },
//   }),
// }));

// jest.mock('../../view_components/context', () => ({
//   useDiscoverContext: () => ({
//     indexPattern: {
//       id: 'mock-index-pattern-id',
//       title: 'mock-index-pattern',
//       fields: [
//         { name: 'timestamp', type: 'date' },
//         { name: 'category', type: 'string' },
//         { name: 'count', type: 'number' },
//         { name: 'price', type: 'number' },
//       ],
//     },
//   }),
// }));

// jest.mock('./visualization_registry', () => ({
//   visualizationRegistry: {
//     registerRule: jest.fn(),
//   },
// }));

// jest.mock('../../view_components/utils/use_visualization_types', () => ({
//   getVisualizationType: () => ({
//     visualizationType: {
//       ui: {
//         style: {
//           defaults: {
//             // Basic controls
//             addTooltip: true,
//             addLegend: true,
//             legendPosition: Positions.RIGHT,
//             addTimeMarker: false,
//             showLine: true,
//             lineMode: 'smooth',
//             lineWidth: 2,
//             showDots: true,
//             // Threshold and grid
//             thresholdLine: {
//               color: '#E7664C',
//               show: false,
//               style: 'full',
//               value: 10,
//               width: 1,
//             },
//             grid: {
//               categoryLines: true,
//               valueLines: true,
//             },
//             // Category axes
//             categoryAxes: [
//               {
//                 id: 'CategoryAxis-1',
//                 type: 'category',
//                 position: 'bottom',
//                 show: true,
//                 style: {},
//                 scale: {
//                   type: 'linear',
//                 },
//                 labels: {
//                   show: true,
//                   filter: true,
//                   rotate: 0,
//                   truncate: 100,
//                 },
//                 title: {
//                   text: 'Category Axis',
//                 },
//               },
//             ],
//             // Value axes
//             valueAxes: [
//               {
//                 id: 'ValueAxis-1',
//                 name: 'LeftAxis-1',
//                 type: 'value',
//                 position: 'left',
//                 show: true,
//                 style: {},
//                 scale: {
//                   type: 'linear',
//                   mode: 'normal',
//                   defaultYExtents: false,
//                   setYExtents: false,
//                 },
//                 labels: {
//                   show: true,
//                   rotate: 0,
//                   filter: false,
//                   truncate: 100,
//                 },
//                 title: {
//                   text: 'Value Axis',
//                 },
//               },
//             ],
//           },
//           render: ({
//             styleOptions,
//             onStyleChange,
//           }: {
//             styleOptions: LineChartStyleControls;
//             onStyleChange: (newOptions: Partial<LineChartStyleControls>) => void;
//             numericalColumns: DiscoverVisColumn[];
//             categoricalColumns: DiscoverVisColumn[];
//             dateColumns: DiscoverVisColumn[];
//           }) => (
//             <div data-test-subj="mockStylePanel">
//               <div>Style Panel Mock</div>
//               <button onClick={() => onStyleChange({ showLine: !styleOptions.showLine })}>
//                 Toggle Line Visibility
//               </button>
//               <pre>{JSON.stringify(styleOptions, null, 2)}</pre>
//             </div>
//           ),
//         },
//       },
//       toExpression: async () => 'mock expression string',
//     },
//     transformedData: [
//       { timestamp: '2023-01-01', category: 'A', count: 10, price: 100 },
//       { timestamp: '2023-01-02', category: 'B', count: 20, price: 200 },
//       { timestamp: '2023-01-03', category: 'A', count: 15, price: 150 },
//     ],
//     numericalColumns: [
//       { id: 1, name: 'count', schema: 'numerical', column: 'count' },
//       { id: 2, name: 'price', schema: 'numerical', column: 'price' },
//     ] as DiscoverVisColumn[],
//     categoricalColumns: [
//       { id: 3, name: 'category', schema: 'categorical', column: 'category' },
//     ] as DiscoverVisColumn[],
//     dateColumns: [
//       { id: 4, name: 'timestamp', schema: 'date', column: 'timestamp' },
//     ] as DiscoverVisColumn[],
//   }),
// }));

// export default {
//   component: DiscoverVisualization,
//   title: 'src/plugins/discover/public/application/components/visualizations/discover_visualization',
//   decorators: [
//     (Story) => (
//       <div style={{ maxWidth: '1200px', padding: '16px' }}>
//         <Story />
//       </div>
//     ),
//   ],
// } as ComponentMeta<typeof DiscoverVisualization>;

// // Mock data for the component props
// const mockRows: OpenSearchSearchHit[] = [
//   {
//     _index: 'test-index',
//     _type: '_doc',
//     _id: '1',
//     _score: 1,
//     _source: { timestamp: '2023-01-01', category: 'A', count: 10, price: 100 },
//   },
//   {
//     _index: 'test-index',
//     _type: '_doc',
//     _id: '2',
//     _score: 1,
//     _source: { timestamp: '2023-01-02', category: 'B', count: 20, price: 200 },
//   },
//   {
//     _index: 'test-index',
//     _type: '_doc',
//     _id: '3',
//     _score: 1,
//     _source: { timestamp: '2023-01-03', category: 'A', count: 15, price: 150 },
//   },
//   {
//     _index: 'test-index',
//     _type: '_doc',
//     _id: '4',
//     _score: 1,
//     _source: { timestamp: '2023-01-04', category: 'C', count: 25, price: 250 },
//   },
//   {
//     _index: 'test-index',
//     _type: '_doc',
//     _id: '5',
//     _score: 1,
//     _source: { timestamp: '2023-01-05', category: 'B', count: 30, price: 300 },
//   },
// ];

// const mockFieldSchema: Array<Partial<IFieldType>> = [
//   { name: 'timestamp', type: 'date' },
//   { name: 'category', type: 'string' },
//   { name: 'count', type: 'number' },
//   { name: 'price', type: 'number' },
// ];

// // Template for the story
// const Template: ComponentStory<typeof DiscoverVisualization> = (args) => (
//   <DiscoverVisualization {...args} />
// );

// // Primary story
// export const Primary = Template.bind({});
// Primary.args = {
//   rows: mockRows,
//   fieldSchema: mockFieldSchema,
// };

// // Story with empty data
// export const EmptyData = Template.bind({});
// EmptyData.args = {
//   rows: [] as OpenSearchSearchHit[],
//   fieldSchema: mockFieldSchema,
// };

// // Story with different field schema
// export const DifferentSchema = Template.bind({});
// DifferentSchema.args = {
//   rows: mockRows,
//   fieldSchema: [
//     { name: 'timestamp', type: 'date' },
//     { name: 'product', type: 'string' },
//     { name: 'revenue', type: 'number' },
//     { name: 'quantity', type: 'number' },
//   ] as Array<Partial<IFieldType>>,
// };

// // Story with partial data
// export const PartialData = Template.bind({});
// PartialData.args = {
//   rows: mockRows.slice(0, 2), // Only first two rows
//   fieldSchema: mockFieldSchema,
// };
