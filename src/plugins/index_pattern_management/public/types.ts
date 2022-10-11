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
  ChromeStart,
  ApplicationStart,
  IUiSettingsClient,
  OverlayStart,
  SavedObjectsStart,
  NotificationsStart,
  DocLinksStart,
  HttpSetup,
  SavedObjectReference,
} from 'src/core/public';
import { DataPublicPluginStart } from 'src/plugins/data/public';
import { EuiTableFieldDataColumnType } from '@elastic/eui';
import { ManagementAppMountParams } from '../../management/public';
import { IndexPatternManagementStart } from './index';
import { OpenSearchDashboardsReactContextValue } from '../../opensearch_dashboards_react/public';

export interface IndexPatternManagmentContext {
  chrome: ChromeStart;
  application: ApplicationStart;
  savedObjects: SavedObjectsStart;
  uiSettings: IUiSettingsClient;
  notifications: NotificationsStart;
  overlays: OverlayStart;
  http: HttpSetup;
  docLinks: DocLinksStart;
  data: DataPublicPluginStart;
  indexPatternManagementStart: IndexPatternManagementStart;
  setBreadcrumbs: ManagementAppMountParams['setBreadcrumbs'];
  getMlCardState: () => MlCardState;
  dataSourceEnabled: boolean;
}

export type IndexPatternManagmentContextValue = OpenSearchDashboardsReactContextValue<
  IndexPatternManagmentContext
>;

export enum MlCardState {
  HIDDEN,
  DISABLED,
  ENABLED,
}

export type DataSourceRef = { title: string } & Pick<SavedObjectReference, 'type' | 'id'>;

export interface IndexPatternTableRecord {
  type: string;
  id: string;
  referenceId?: string;
}

export interface IndexPatternTableColumn<T> {
  id: string;
  euiColumn: Omit<EuiTableFieldDataColumnType<IndexPatternTableRecord>, 'sortable'>;
  data?: T;
  loadData: () => Promise<T>;
}
