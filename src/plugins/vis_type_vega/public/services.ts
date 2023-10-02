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

import { CoreStart, NotificationsStart, IUiSettingsClient } from 'src/core/public';

import { DataPublicPluginStart } from '../../data/public';
import { createGetterSetter } from '../../opensearch_dashboards_utils/public';
import { MapsLegacyConfig } from '../../maps_legacy/config';
import { UiActionsStart } from '../../ui_actions/public';

export const [getData, setData] = createGetterSetter<DataPublicPluginStart>('Data');

export const [getNotifications, setNotifications] = createGetterSetter<NotificationsStart>(
  'Notifications'
);

export const [getUiActions, setUiActions] = createGetterSetter<UiActionsStart>('UIActions');

export const [getUISettings, setUISettings] = createGetterSetter<IUiSettingsClient>('UISettings');

export const [getInjectedMetadata, setInjectedMetadata] = createGetterSetter<
  CoreStart['injectedMetadata']
>('InjectedMetadata');

export const [getInjectedVars, setInjectedVars] = createGetterSetter<{
  enableExternalUrls: boolean;
  emsTileLayerId: unknown;
}>('InjectedVars');

export const [getMapsLegacyConfig, setMapsLegacyConfig] = createGetterSetter<MapsLegacyConfig>(
  'MapsLegacyConfig'
);

export const getEnableExternalUrls = () => getInjectedVars().enableExternalUrls;
export const getEmsTileLayerId = () => getMapsLegacyConfig().emsTileLayerId;
export const getShowRegionDeniedWarning = () => getMapsLegacyConfig().showRegionDeniedWarning;
