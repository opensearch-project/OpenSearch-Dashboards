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
import { EditDataSourceWithRouter } from '../components/edit_data_source';
import { DataSourceHomePanel } from '../components/data_source_home_panel/data_source_home_panel';
import { CreateDataSourcePanel } from '../components/data_source_creation_panel/create_data_source_panel';
import { DataSourceManagementContext } from '../types';
import { AuthenticationMethodRegistry } from '../auth_registry';
import { ConfigureDirectQueryDataSourceWithRouter } from '../components/direct_query_data_sources_components/direct_query_data_source_configuration/configure_direct_query_data_sources';

export interface DataSourceManagementStartDependencies {
  data: DataPublicPluginStart;
}

export async function mountManagementSection(
  getStartServices: StartServicesAccessor<DataSourceManagementStartDependencies>,
  params: ManagementAppMountParams,
  authMethodsRegistry: AuthenticationMethodRegistry,
  featureFlagStatus: boolean
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
    authenticationMethodRegistry: authMethodsRegistry,
  };

  ReactDOM.render(
    <OpenSearchDashboardsContextProvider services={deps}>
      <I18nProvider>
        <Router history={params.history}>
          <Switch>
            <Route path={['/create']}>
              <CreateDataSourcePanel {...params} featureFlagStatus={featureFlagStatus} />
            </Route>
            {featureFlagStatus && (
              <Route path={['/configure/OpenSearch']}>
                <CreateDataSourceWizardWithRouter />
              </Route>
            )}
            <Route path={['/configure/:type']}>
              <ConfigureDirectQueryDataSourceWithRouter notifications={notifications} />
            </Route>
            <Route path={['/:id']}>
              <EditDataSourceWithRouter />
            </Route>
            <Route path={['/']}>
              <DataSourceHomePanel history={params.history} featureFlagStatus={featureFlagStatus} />
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
