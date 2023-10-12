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
import {
  AppMountParameters,
  ChromeBreadcrumb,
  ScopedHistory,
  StartServicesAccessor,
} from 'src/core/public';

import { EuiPage, EuiPageBody } from '@elastic/eui';
import {
  OpenSearchDashboardsContextProvider,
  reactRouterNavigate,
} from '../../../opensearch_dashboards_react/public';
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
  params: AppMountParameters,
  getMlCardState: () => MlCardState
) {
  const [
    { chrome, application, savedObjects, uiSettings, notifications, overlays, http, docLinks },
    { data, dataSource },
    indexPatternManagementStart,
  ] = await getStartServices();
  const canSave = Boolean(application.capabilities.indexPatterns.save);
  const dataSourceEnabled = !!dataSource;

  if (!canSave) {
    chrome.setBadge(readOnlyBadge);
  }

  const setBreadcrumbsScope = (crumbs: ChromeBreadcrumb[] = [], appHistory?: ScopedHistory) => {
    const wrapBreadcrumb = (item: ChromeBreadcrumb, scopedHistory: ScopedHistory) => ({
      ...item,
      ...(item.href ? reactRouterNavigate(scopedHistory, item.href) : {}),
    });

    chrome.setBreadcrumbs([
      ...crumbs.map((item) => wrapBreadcrumb(item, appHistory || params.history)),
    ]);
  };

  const deps: IndexPatternManagmentContext = {
    chrome,
    application,
    savedObjects,
    uiSettings,
    notifications,
    overlays,
    http,
    docLinks,
    data,
    indexPatternManagementStart: indexPatternManagementStart as IndexPatternManagementStart,
    setBreadcrumbs: setBreadcrumbsScope,
    getMlCardState,
    dataSourceEnabled,
  };

  ReactDOM.render(
    <EuiPage restrictWidth="1200px">
      <EuiPageBody component="main">
        <OpenSearchDashboardsContextProvider services={deps}>
          <I18nProvider>
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
          </I18nProvider>
        </OpenSearchDashboardsContextProvider>
      </EuiPageBody>
    </EuiPage>,
    params.element
  );

  return () => {
    chrome.docTitle.reset();
    ReactDOM.unmountComponentAtNode(params.element);
  };
}
