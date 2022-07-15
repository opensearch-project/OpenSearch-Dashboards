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

import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Switch, Route } from 'react-router-dom';
import { I18nProvider } from '@osd/i18n/react';

import { StartServicesAccessor } from 'src/core/public';
import { DataPublicPluginStart } from 'src/plugins/data/public';
import { ManagementAppMountParams } from '../../../management/public';

import { CredentialManagementStart } from '../plugin';
import { CredentialManagementContext } from '../types';
import {
  CredentialsTableWithRouter,
  CreateCredentialWizardWithRouter,
  EditCredentialPageWithRouter,
} from '../components';
import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';

export interface CredentialManagementStartDependencies {
  data: DataPublicPluginStart;
}

export async function mountManagementSection(
  getStartServices: StartServicesAccessor<CredentialManagementStartDependencies>,
  params: ManagementAppMountParams
) {
  const [
    { chrome, application, savedObjects, uiSettings, notifications, overlays, http, docLinks },
    { data },
    credentialManagementStart,
  ] = await getStartServices();

  const deps: CredentialManagementContext = {
    chrome,
    application,
    savedObjects,
    uiSettings,
    notifications,
    overlays,
    http,
    docLinks,
    data,
    credentialManagementStart: credentialManagementStart as CredentialManagementStart,
    setBreadcrumbs: params.setBreadcrumbs,
  };

  ReactDOM.render(
    <OpenSearchDashboardsContextProvider services={deps}>
      <I18nProvider>
        <Router history={params.history}>
          <Switch>
            <Route path={['/create']}>
              <CreateCredentialWizardWithRouter />
            </Route>
            <Route path={['/:id']}>
              <EditCredentialPageWithRouter />
            </Route>
            <Route path={['/']}>
              <CredentialsTableWithRouter canSave={true} />
            </Route>
          </Switch>
        </Router>
      </I18nProvider>
    </OpenSearchDashboardsContextProvider>,
    params.element
  );

  return () => {
    chrome.docTitle.reset();
    ReactDOM.unmountComponentAtNode(params.element);
  };
}
