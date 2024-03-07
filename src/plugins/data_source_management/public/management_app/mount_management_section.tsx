/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { StartServicesAccessor } from 'src/core/public';

import { I18nProvider } from '@osd/i18n/react';
import React from 'react';
import ReactDOM from 'react-dom';
import { Route, Router, Switch } from 'react-router-dom';
import { DataPublicPluginStart } from 'src/plugins/data/public';
import { ManagementAppMountParams } from '../../../management/public';

import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';
import { CreateDataSourceWizardWithRouter } from '../components/create_data_source_wizard';
import { DataSourceTableWithRouter } from '../components/data_source_table';
import { DataSourceManagementContext } from '../types';
import { EditDataSourceWithRouter } from '../components/edit_data_source';

export interface DataSourceManagementStartDependencies {
  data: DataPublicPluginStart;
}

export async function mountManagementSection(
  getStartServices: StartServicesAccessor<DataSourceManagementStartDependencies>,
  params: ManagementAppMountParams
) {
  const [
    { chrome, application, savedObjects, uiSettings, notifications, overlays, http, docLinks },
  ] = await getStartServices();

  const deps: DataSourceManagementContext = {
    chrome,
    application,
    savedObjects,
    uiSettings,
    notifications,
    overlays,
    http,
    docLinks,
    setBreadcrumbs: params.setBreadcrumbs,
  };

  ReactDOM.render(
    <OpenSearchDashboardsContextProvider services={deps}>
      <I18nProvider>
        <Router history={params.history}>
          <Switch>
            <Route path={['/create']}>
              <CreateDataSourceWizardWithRouter />
            </Route>
            <Route path={['/:id']}>
              <EditDataSourceWithRouter />
            </Route>
            <Route path={['/']}>
              <DataSourceTableWithRouter />
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
