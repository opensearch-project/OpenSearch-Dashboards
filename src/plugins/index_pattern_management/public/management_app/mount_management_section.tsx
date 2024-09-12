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
import { Router, Switch, Route } from 'react-router-dom';

import { i18n } from '@osd/i18n';
import { I18nProvider } from '@osd/i18n/react';
import { StartServicesAccessor } from 'src/core/public';

import { DataSourcePluginSetup } from 'src/plugins/data_source/public';
import { EuiPageContent } from '@elastic/eui';
import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';
import { ManagementAppMountParams } from '../../../management/public';
import {
  IndexPatternTableWithRouter,
  EditIndexPatternContainer,
  CreateEditFieldContainer,
  CreateIndexPatternWizardWithRouter,
} from '../components';
import { IndexPatternManagementStartDependencies, IndexPatternManagementStart } from '../plugin';
import { IndexPatternManagmentContext, MlCardState } from '../types';

const readOnlyBadge = {
  text: i18n.translate('indexPatternManagement.indexPatterns.badge.readOnly.text', {
    defaultMessage: 'Read only',
  }),
  tooltip: i18n.translate('indexPatternManagement.indexPatterns.badge.readOnly.tooltip', {
    defaultMessage: 'Unable to save index patterns',
  }),
  iconType: 'glasses',
};

export async function mountManagementSection(
  getStartServices: StartServicesAccessor<IndexPatternManagementStartDependencies>,
  params: ManagementAppMountParams & { wrapInPage?: boolean },
  getMlCardState: () => MlCardState,
  dataSource?: DataSourcePluginSetup
) {
  const [
    {
      chrome,
      application,
      savedObjects,
      uiSettings,
      notifications,
      overlays,
      http,
      docLinks,
      workspaces,
    },
    { data, navigation },
    indexPatternManagementStart,
  ] = await getStartServices();
  const canSave = Boolean(application.capabilities?.indexPatterns?.save);
  const dataSourceEnabled = dataSource?.dataSourceEnabled ?? false;
  const hideLocalCluster = dataSource?.hideLocalCluster ?? false;

  if (!canSave) {
    chrome.setBadge(readOnlyBadge);
  }

  const deps: IndexPatternManagmentContext = {
    chrome,
    application,
    savedObjects,
    uiSettings,
    navigationUI: navigation.ui,
    notifications,
    overlays,
    http,
    docLinks,
    data,
    indexPatternManagementStart: indexPatternManagementStart as IndexPatternManagementStart,
    setBreadcrumbs: params.setBreadcrumbs,
    getMlCardState,
    dataSourceEnabled,
    hideLocalCluster,
    workspaces,
  };

  const showActionsInHeader = uiSettings.get('home:useNewHomePage');

  const content = (
    <Router history={params.history}>
      <Switch>
        <Route path={['/create']}>
          <CreateIndexPatternWizardWithRouter />
        </Route>
        <Route path={['/patterns/:id/field/:fieldName', '/patterns/:id/create-field/']}>
          <CreateEditFieldContainer />
        </Route>
        <Route path={['/patterns/:id']}>
          <EditIndexPatternContainer />
        </Route>
        <Route path={['/']}>
          <IndexPatternTableWithRouter canSave={canSave} />
        </Route>
      </Switch>
    </Router>
  );

  ReactDOM.render(
    <OpenSearchDashboardsContextProvider services={deps}>
      <I18nProvider>
        {params.wrapInPage ? (
          <EuiPageContent
            hasShadow={false}
            hasBorder={false}
            color="transparent"
            paddingSize={showActionsInHeader ? 'm' : 'l'}
          >
            {content}
          </EuiPageContent>
        ) : (
          content
        )}
      </I18nProvider>
    </OpenSearchDashboardsContextProvider>,
    params.element
  );

  return () => {
    chrome.docTitle.reset();
    ReactDOM.unmountComponentAtNode(params.element);
  };
}
