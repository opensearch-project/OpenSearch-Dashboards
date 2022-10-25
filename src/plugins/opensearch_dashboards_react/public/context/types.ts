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

import * as React from 'react';
import { Observable } from 'rxjs';
import { CoreStart } from '../../../../core/public';
import { OpenSearchDashboardsReactOverlays } from '../overlays';
import { OpenSearchDashboardsReactNotifications } from '../notifications';

export type OpenSearchDashboardsServices = Partial<CoreStart>;

export interface OpenSearchDashboardsReactContextValue<
  Services extends OpenSearchDashboardsServices
> {
  readonly services: Services;
  readonly overlays: OpenSearchDashboardsReactOverlays;
  readonly notifications: OpenSearchDashboardsReactNotifications;
}

export interface OpenSearchDashboardsReactContext<T extends OpenSearchDashboardsServices> {
  value: OpenSearchDashboardsReactContextValue<T>;
  Provider: React.FC<{ services?: T }>;
  Consumer: React.Consumer<OpenSearchDashboardsReactContextValue<T>>;
}

export interface DashboardListSource {
  name: string;
  listProviderFn: () => Observable<DashboardListItem>;
}

export type DashboardListSources = DashboardListSource[];

export interface DashboardListItem {
  id: string;
  title: string;
  type: string;
  description: string;
  url: string;
  listType: string;
}
export type DashboardListItems = DashboardListItem[];

export type DashboardCreators = DashboardCreator[];

export type DashboardCreatorFn = (event: any, history: any) => void;
export type DashboardItemCreatorClickHandler = (
  creatorFn: DashboardCreatorFn
) => (event: any) => void;

export interface DashboardCreator {
  id: string; // key identifier for creator plugin/module
  name: string; // display name for create link
  i18nId?: string; // unique identifier for react-intl FormattedMessage
  i18nDescription?: string; // helpful description of this i18n context
  i18nDefaultMessage?: string; // FormattedMessage default message, in tag-replace format
  i18nDefaultValues?: object; // FormattedMessage default value
  i18nEntityName?: string; // translation key
  defaultText: string; // default translation text
  creatorFn: DashboardCreatorFn; // onClick call this
}
