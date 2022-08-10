/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Switch, Route } from 'react-router-dom';
import { i18n } from '@osd/i18n';
import { I18nProvider } from '@osd/i18n/react';

import { StartServicesAccessor } from 'src/core/public';
import { ManagementAppMountParams } from '../../../management/public';

import { CredentialManagementContext } from '../types';
import {
  CredentialsTableWithRouter,
  CreateCredentialWizardWithRouter,
  EditCredentialPageWithRouter,
} from '../components';
import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';

export async function mountManagementSection(
  getStartServices: StartServicesAccessor,
  params: ManagementAppMountParams
) {
  const [
    { chrome, application, savedObjects, uiSettings, notifications, overlays, docLinks },
  ] = await getStartServices();

  const deps: CredentialManagementContext = {
    chrome,
    application,
    savedObjects,
    uiSettings,
    notifications,
    overlays,
    docLinks,
    setBreadcrumbs: params.setBreadcrumbs,
  };

  /* Browser - Page Title */
  const title = i18n.translate('credentialManagement.objects.credentialsTitle', {
    defaultMessage: 'Credentials',
  });

  chrome.docTitle.change(title);

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
