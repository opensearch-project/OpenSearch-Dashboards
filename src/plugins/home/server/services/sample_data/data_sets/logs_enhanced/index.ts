/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'path';
import { i18n } from '@osd/i18n';
import { getSavedObjects } from './saved_objects';
import { fieldMappings } from './field_mappings';
import { SampleDatasetSchema, AppLinkSchema } from '../../lib/sample_dataset_registry_types';
import { appendDataSourceId, getSavedObjectsWithDataSource } from '../util';

const logsEnhancedName = i18n.translate('home.sampleData.logsEnhancedSpecTitle', {
  defaultMessage: 'Sample web logs (enhanced)',
});
const logsEnhancedDescription = i18n.translate('home.sampleData.logsEnhancedSpecDescription', {
  defaultMessage:
    'Sample data, visualizations, and dashboards for monitoring web logs but creates an index pattern with a custom ID.',
});
const initialAppLinks = [] as AppLinkSchema[];

const DEFAULT_INDEX = 'opensearch_dashboards_sample_data_logs_enhanced';
const DASHBOARD_ID = 'edf84fe0-e1a0-11e7-b6d5-4dc382ef7f5b';

export const logsEnhancedSpecProvider = function (): SampleDatasetSchema {
  return {
    id: 'logs_enhanced',
    name: logsEnhancedName,
    description: logsEnhancedDescription,
    previewImagePath: '/plugins/home/assets/sample_data_resources/logs/dashboard.png',
    darkPreviewImagePath: '/plugins/home/assets/sample_data_resources/logs/dashboard_dark.png',
    hasNewThemeImages: true,
    overviewDashboard: DASHBOARD_ID,
    getDataSourceIntegratedDashboard: appendDataSourceId(DASHBOARD_ID),
    appLinks: initialAppLinks,
    defaultIndex: DEFAULT_INDEX,
    getDataSourceIntegratedDefaultIndex: appendDataSourceId(DEFAULT_INDEX),
    savedObjects: getSavedObjects(),
    getDataSourceIntegratedSavedObjects: (dataSourceId?: string, dataSourceTitle?: string) =>
      getSavedObjectsWithDataSource(getSavedObjects(), dataSourceId, dataSourceTitle),
    dataIndices: [
      {
        id: 'logs_enhanced',
        dataPath: path.join(__dirname, './logs.json.gz'),
        fields: fieldMappings,
        timeFields: ['timestamp'],
        currentTimeMarker: '2018-08-01T00:00:00',
        preserveDayOfWeekTimeOfDay: true,
      },
    ],
    status: 'not_installed',
  };
};
