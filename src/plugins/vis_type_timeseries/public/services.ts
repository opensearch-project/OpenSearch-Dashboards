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

import {
  I18nStart,
  SavedObjectsStart,
  IUiSettingsClient,
  CoreStart,
  NotificationsStart,
} from 'src/core/public';
import { DataSourceManagementPluginSetup } from 'src/plugins/data_source_management/public';
import { createGetterSetter } from '../../opensearch_dashboards_utils/public';
import { ChartsPluginSetup } from '../../charts/public';
import { DataPublicPluginStart } from '../../data/public';
import { DataSourcePluginSetup } from '../../data_source/public';

export const [getUISettings, setUISettings] = createGetterSetter<IUiSettingsClient>('UISettings');

export const [getFieldFormats, setFieldFormats] = createGetterSetter<
  DataPublicPluginStart['fieldFormats']
>('FieldFormats');

export const [getSavedObjectsClient, setSavedObjectsClient] = createGetterSetter<SavedObjectsStart>(
  'SavedObjectsClient'
);

export const [getCoreStart, setCoreStart] = createGetterSetter<CoreStart>('CoreStart');

export const [getDataStart, setDataStart] = createGetterSetter<DataPublicPluginStart>('DataStart');

export const [getI18n, setI18n] = createGetterSetter<I18nStart>('I18n');

export const [getChartsSetup, setChartsSetup] = createGetterSetter<ChartsPluginSetup>(
  'ChartsPluginSetup'
);

export const [getDataSourceSetup, setDataSourceSetup] = createGetterSetter<{
  dataSource: DataSourcePluginSetup | undefined;
}>('DataSourceSetup');

export const [getDataSourceManagementSetup, setDataSourceManagementSetup] = createGetterSetter<{
  dataSourceManagement: DataSourceManagementPluginSetup | undefined;
}>('DataSourceManagementSetup');

export const [getNotifications, setNotifications] = createGetterSetter<NotificationsStart>(
  'Notifications'
);
