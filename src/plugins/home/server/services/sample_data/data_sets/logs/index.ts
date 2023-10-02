/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import path from 'path';
import { i18n } from '@osd/i18n';
import { getSavedObjects } from './saved_objects';
import { fieldMappings } from './field_mappings';
import { SampleDatasetSchema, AppLinkSchema } from '../../lib/sample_dataset_registry_types';
import { appendDataSourceId, getSavedObjectsWithDataSource } from '../util';

const logsName = i18n.translate('home.sampleData.logsSpecTitle', {
  defaultMessage: 'Sample web logs',
});
const logsDescription = i18n.translate('home.sampleData.logsSpecDescription', {
  defaultMessage: 'Sample data, visualizations, and dashboards for monitoring web logs.',
});
const initialAppLinks = [] as AppLinkSchema[];

const DEFAULT_INDEX = '90943e30-9a47-11e8-b64d-95841ca0b247';
const DASHBOARD_ID = 'edf84fe0-e1a0-11e7-b6d5-4dc382ef7f5b';

export const logsSpecProvider = function (): SampleDatasetSchema {
  return {
    id: 'logs',
    name: logsName,
    description: logsDescription,
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
        id: 'logs',
        dataPath: path.join(__dirname, './logs.json.gz'),
        fields: fieldMappings,
        timeFields: ['timestamp', 'utc_time'],
        currentTimeMarker: '2018-08-01T00:00:00',
        preserveDayOfWeekTimeOfDay: true,
      },
    ],
    status: 'not_installed',
  };
};
