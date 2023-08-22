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
import ReactDOM from 'react-dom';
import { I18nProvider } from '@osd/i18n/react';
import { OpenSearchDashboardsContextProvider } from '../../../../src/plugins/opensearch_dashboards_react/public';
import { NewsfeedApiEndpoint } from '../../../../src/plugins/newsfeed/public';
import { AppMountParameters, CoreStart } from '../../../../src/core/public';
import { AppPluginStartDependencies } from './types';
import { OpenSearchDashboardsOverviewApp } from './components/app';

export const renderApp = (
  core: CoreStart,
  deps: AppPluginStartDependencies,
  { appBasePath, element }: AppMountParameters
) => {
  const { notifications, http } = core;
  const { newsfeed, home, navigation } = deps;
  const newsfeed$ = newsfeed?.createNewsFeed$(NewsfeedApiEndpoint.OPENSEARCH_DASHBOARDS_ANALYTICS);
  const navLinks = core.chrome.navLinks.getAll();
  const solutions = home.featureCatalogue
    .getSolutions()
    .filter(({ id }) => id !== 'opensearchDashboards')
    .filter(({ id }) => navLinks.find(({ category, hidden }) => !hidden && category?.id === id));
  const features = home.featureCatalogue.get();

  ReactDOM.render(
    <I18nProvider>
      <OpenSearchDashboardsContextProvider services={{ ...core, ...deps }}>
        <OpenSearchDashboardsOverviewApp
          basename={appBasePath}
          notifications={notifications}
          http={http}
          navigation={navigation}
          newsfeed$={newsfeed$}
          solutions={solutions}
          features={features}
          logos={core.chrome.logos}
        />
      </OpenSearchDashboardsContextProvider>
    </I18nProvider>,
    element
  );

  return () => ReactDOM.unmountComponentAtNode(element);
};
