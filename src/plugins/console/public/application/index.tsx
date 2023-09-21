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

import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { HttpSetup, IUiSettingsClient, NotificationsSetup } from 'src/core/public';
import { ServicesContextProvider, EditorContextProvider, RequestContextProvider } from './contexts';
import { Main } from './containers';
import { createStorage, createHistory, createSettings } from '../services';
import * as localStorageObjectClient from '../lib/local_storage_object_client';
import { createUsageTracker } from '../services/tracker';
import { UsageCollectionSetup } from '../../../usage_collection/public';
import { createApi, createOpenSearchHostService } from './lib';

export interface BootDependencies {
  http: HttpSetup;
  docLinkVersion: string;
  I18nContext: any;
  notifications: NotificationsSetup;
  usageCollection?: UsageCollectionSetup;
  element: HTMLElement;
  dataSourceId?: string;
  uiSettings: IUiSettingsClient;
}

export function renderApp({
  I18nContext,
  notifications,
  docLinkVersion,
  usageCollection,
  element,
  http,
  dataSourceId,
  uiSettings,
}: BootDependencies) {
  const trackUiMetric = createUsageTracker(usageCollection);
  trackUiMetric.load('opened_app');

  const storage = createStorage({
    engine: window.localStorage,
    prefix: 'sense:',
  });
  const history = createHistory({ storage });
  const settings = createSettings({ storage });
  const objectStorageClient = localStorageObjectClient.create(storage);
  const api = createApi({ http });
  const opensearchHostService = createOpenSearchHostService({ api });

  render(
    <I18nContext>
      <ServicesContextProvider
        value={{
          docLinkVersion,
          services: {
            opensearchHostService,
            storage,
            history,
            settings,
            notifications,
            trackUiMetric,
            objectStorageClient,
            http,
            uiSettings,
          },
        }}
      >
        <RequestContextProvider>
          <EditorContextProvider settings={settings.toJSON()}>
            <Main dataSourceId={dataSourceId} />
          </EditorContextProvider>
        </RequestContextProvider>
      </ServicesContextProvider>
    </I18nContext>,
    element
  );

  return () => unmountComponentAtNode(element);
}
