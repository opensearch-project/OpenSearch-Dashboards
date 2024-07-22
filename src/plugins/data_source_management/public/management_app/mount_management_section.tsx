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
import { EuiPageContent } from '@elastic/eui';
import { ManagementAppMountParams } from '../../../management/public';

import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';
import { CreateDataSourceWizardWithRouter } from '../components/create_data_source_wizard';
import { EditDataSourceWithRouter } from '../components/edit_data_source';
import { DataSourceHomePanel } from '../components/data_source_home_panel/data_source_home_panel';
import { CreateDataSourcePanel } from '../components/data_source_creation_panel/create_data_source_panel';
import { DataSourceManagementContext } from '../types';
import { AuthenticationMethodRegistry } from '../auth_registry';
import { ConfigureDirectQueryDataSourceWithRouter } from '../components/direct_query_data_sources_components/direct_query_data_source_configuration/configure_direct_query_data_sources';
import { DirectQueryDataConnectionDetail } from '../components/direct_query_data_sources_components/connection_detail/direct_query_connection_detail';

export interface DataSourceManagementStartDependencies {
  data: DataPublicPluginStart;
}

export async function mountManagementSection(
  getStartServices: StartServicesAccessor<DataSourceManagementStartDependencies>,
  params: ManagementAppMountParams & { wrapInPage?: boolean },
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

  const canManageDataSource = !!application.capabilities?.dataSource?.canManage;

  const content = (
    <Router history={params.history}>
      <Switch>
        <Route path={['/manage/:dataSourceName']}>
          <DirectQueryDataConnectionDetail
            featureFlagStatus={featureFlagStatus}
            http={http}
            notifications={notifications}
            setBreadcrumbs={params.setBreadcrumbs}
            application={application}
          />
        </Route>
        {canManageDataSource && (
          <Route path={['/create']}>
            <CreateDataSourcePanel {...params} featureFlagStatus={featureFlagStatus} />
          </Route>
        )}
        {featureFlagStatus && canManageDataSource && (
          <Route path={['/configure/OpenSearch']}>
            <CreateDataSourceWizardWithRouter />
          </Route>
        )}
        {canManageDataSource && (
          <Route path={['/configure/:type']}>
            <ConfigureDirectQueryDataSourceWithRouter notifications={notifications} />
          </Route>
        )}
        {featureFlagStatus && (
          <Route path={['/:id']}>
            <EditDataSourceWithRouter />
          </Route>
        )}
        <Route path={['/']}>
          <DataSourceHomePanel history={params.history} featureFlagStatus={featureFlagStatus} />
        </Route>
      </Switch>
    </Router>
  );

  ReactDOM.render(
    <OpenSearchDashboardsContextProvider services={deps}>
      <I18nProvider>
        {params.wrapInPage ? (
          <EuiPageContent hasShadow={false} hasBorder={false} color="transparent">
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
