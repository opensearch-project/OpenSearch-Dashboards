// /*
//  * Copyright OpenSearch Contributors
//  * SPDX-License-Identifier: Apache-2.0
//  */

// import path from 'path';
// import { i18n } from '@osd/i18n';
// import { getSavedObjects } from './saved_objects';
// import { fieldMappings } from './field_mappings';
// import {
//   SampleDatasetSchema,
//   AppLinkSchema,
// } from '../../../../../src/plugins/home/server/services/sample_data/lib/sample_dataset_registry_types';
// // import {
// //   appendDataSourceId,
// //   getSavedObjectsWithDataSource,
// // } from '../../../../../src/plugins/home/server/services/sample_data/data_sets';

// const logsPPLName = i18n.translate('home.sampleData.logsPPLSpecTitle', {
//   defaultMessage: '[PPL] Sample web logs',
// });
// const logsPPLDescription = i18n.translate('home.sampleData.logsPPLSpecDescription', {
//   defaultMessage:
//     'Sample data, visualizations, and dashboards for monitoring web logs but defaults to PPL for the query language.',
// });
// const initialAppLinks = [] as AppLinkSchema[];

// const DEFAULT_INDEX = 'opensearch_dashboards_sample_data_ppl';
// const DASHBOARD_ID = '9011e5eb-7018-463f-8541-14f98a938f16';

// export const logsPPLSpecProvider = function (): SampleDatasetSchema {
//   return {
//     id: 'ppl',
//     name: logsPPLName,
//     description: logsPPLDescription,
//     previewImagePath: '/plugins/home/assets/sample_data_resources/logs/dashboard.png',
//     darkPreviewImagePath: '/plugins/home/assets/sample_data_resources/logs/dashboard_dark.png',
//     hasNewThemeImages: true,
//     overviewDashboard: DASHBOARD_ID,
//     getDataSourceIntegratedDashboard: appendDataSourceId(DASHBOARD_ID),
//     appLinks: initialAppLinks,
//     defaultIndex: DEFAULT_INDEX,
//     getDataSourceIntegratedDefaultIndex: appendDataSourceId(DEFAULT_INDEX),
//     savedObjects: getSavedObjects(),
//     getDataSourceIntegratedSavedObjects: (dataSourceId?: string, dataSourceTitle?: string) =>
//       getSavedObjectsWithDataSource(getSavedObjects(), dataSourceId, dataSourceTitle),
//     dataIndices: [
//       {
//         id: 'ppl',
//         dataPath: path.join(__dirname, './logs.json.gz'),
//         fields: fieldMappings,
//         timeFields: ['timestamp'],
//         currentTimeMarker: '2018-08-01T00:00:00',
//         preserveDayOfWeekTimeOfDay: true,
//       },
//     ],
//     status: 'not_installed',
//   };
// };
