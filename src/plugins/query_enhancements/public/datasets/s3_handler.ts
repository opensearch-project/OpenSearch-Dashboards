/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// import { Dataset, DataStructure, DEFAULT_DATA, DataStructureFeatureMeta } from '../../../../common';
// import { IndexPatternsContract } from '../../../index_patterns';
// import { DatasetHandlerConfig } from '../types';

// const S3_ICON = './assets/s3_mark.svg';

// export const s3HandlerConfig: DatasetHandlerConfig = {
//   toDataset: (dataStructure: DataStructure): Dataset => ({
//     id: dataStructure.id,
//     title: dataStructure.title,
//     type: DEFAULT_DATA.SET_TYPES.S3,
//     dataSource: dataStructure.parent
//       ? {
//           id: dataStructure.parent.id,
//           title: dataStructure.parent.title,
//           type: dataStructure.parent.type,
//         }
//       : undefined,
//   }),

//   toDataStructure: (dataset: Dataset): DataStructure => ({
//     id: dataset.id,
//     title: dataset.title,
//     type: DEFAULT_DATA.SET_TYPES.S3,
//     parent: dataset.dataSource
//       ? {
//           id: dataset.dataSource.id!,
//           title: dataset.dataSource.title,
//           type: dataset.dataSource.type,
//         }
//       : undefined,
//     meta: {
//       type: DEFAULT_DATA.STRUCTURE_META_TYPES.FEATURE,
//       icon: S3_ICON,
//       tooltip: 'S3 Data Source',
//     } as DataStructureFeatureMeta,
//   }),

//   fetchOptions: async (
//     dataStructure: DataStructure,
//     indexPatterns: IndexPatternsContract
//   ): Promise<DataStructure[]> => {
//     // This is a placeholder implementation. You'll need to implement
//     // the actual logic to fetch S3 data structures.
//     if (dataStructure.type === DEFAULT_DATA.SOURCE_TYPES.S3) {
//       // Fetch connections
//       return [
//         {
//           id: `${dataStructure.id}::mys3`,
//           title: 'mys3',
//           type: DEFAULT_DATA.STRUCTURE_TYPES.CONNECTION,
//           parent: dataStructure,
//           meta: {
//             type: DEFAULT_DATA.STRUCTURE_META_TYPES.FEATURE,
//             icon: S3_ICON,
//             tooltip: 'S3 Connection',
//           } as DataStructureFeatureMeta,
//         },
//       ];
//     } else if (dataStructure.type === DEFAULT_DATA.STRUCTURE_TYPES.CONNECTION) {
//       // Fetch databases
//       return [
//         {
//           id: `${dataStructure.id}.defaultDb`,
//           title: 'defaultDb',
//           type: DEFAULT_DATA.STRUCTURE_TYPES.DATABASE,
//           parent: dataStructure,
//           meta: {
//             type: DEFAULT_DATA.STRUCTURE_META_TYPES.FEATURE,
//             icon: S3_ICON,
//             tooltip: 'S3 Connections',
//           } as DataStructureFeatureMeta,
//         },
//       ];
//     } else if (dataStructure.type === DEFAULT_DATA.STRUCTURE_TYPES.DATABASE) {
//       // Fetch tables
//       return [
//         {
//           id: `${dataStructure.id}.table1`,
//           title: 'table1',
//           type: DEFAULT_DATA.STRUCTURE_TYPES.TABLE,
//           parent: dataStructure,
//           meta: {
//             type: DEFAULT_DATA.STRUCTURE_META_TYPES.FEATURE,
//             icon: S3_ICON,
//             tooltip: 'S3 Table',
//           } as DataStructureFeatureMeta,
//         },
//         {
//           id: `${dataStructure.id}.table2`,
//           title: 'table2',
//           type: DEFAULT_DATA.STRUCTURE_TYPES.TABLE,
//           parent: dataStructure,
//           meta: {
//             type: DEFAULT_DATA.STRUCTURE_META_TYPES.FEATURE,
//             icon: S3_ICON,
//             tooltip: 'S3 Table',
//           } as DataStructureFeatureMeta,
//         },
//       ];
//     }
//     return [];
//   },

//   isLeaf: (dataStructure: DataStructure): boolean => {
//     return dataStructure.type === DEFAULT_DATA.STRUCTURE_TYPES.TABLE;
//   },
// };

// export function s3ToDataStructure(dataset: Dataset): DataStructure {
//   return {
//     id: dataset.id,
//     title: dataset.title,
//     type: DEFAULT_DATA.SET_TYPES.S3,
//     parent: dataset.dataSource
//       ? {
//           id: dataset.dataSource.id!,
//           title: dataset.dataSource.title!,
//           type: DEFAULT_DATA.SOURCE_TYPES.S3,
//         }
//       : undefined,
//     meta: {
//       type: DEFAULT_DATA.STRUCTURE_META_TYPES.FEATURE,
//       icon: S3_ICON,
//       tooltip: 'S3 Data Source',
//     } as DataStructureFeatureMeta,
//   };
// }

// export function s3ToDataset(s3: DataStructure): Dataset {
//   return {
//     id: s3.id,
//     title: s3.title,
//     type: DEFAULT_DATA.SET_TYPES.S3,
//     dataSource: s3.parent
//       ? {
//           id: s3.parent.id,
//           title: s3.parent.title,
//           type: s3.parent.type,
//         }
//       : undefined,
//   };
// }
