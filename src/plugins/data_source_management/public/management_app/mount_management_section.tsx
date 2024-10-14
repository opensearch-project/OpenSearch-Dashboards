/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MountPoint, StartServicesAccessor } from 'src/core/public';

import { EuiPageContent } from '@elastic/eui';
import { I18nProvider } from '@osd/i18n/react';
import React from 'react';
import ReactDOM from 'react-dom';
import { Route, Router, Switch } from 'react-router-dom';
import { DataPublicPluginStart } from 'src/plugins/data/public';
import { ManagementAppMountParams } from '../../../management/public';

import { NavigationPublicPluginStart } from '../../../navigation/public';
import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';
import { AuthenticationMethodRegistry } from '../auth_registry';
import { CreateDataSourceWizardWithRouter } from '../components/create_data_source_wizard';
import { CreateDataSourcePanel } from '../components/data_source_creation_panel/create_data_source_panel';
import { DataSourceHomePanel } from '../components/data_source_home_panel/data_source_home_panel';
import { DirectQueryDataConnectionDetail } from '../components/direct_query_data_sources_components/connection_detail/direct_query_connection_detail';
import { ConfigureDirectQueryDataSourceWithRouter } from '../components/direct_query_data_sources_components/direct_query_data_source_configuration/configure_direct_query_data_sources';
import { EditDataSourceWithRouter } from '../components/edit_data_source';
import { DataSourceManagementContext } from '../types';

export interface DataSourceManagementStartDependencies {
  data: DataPublicPluginStart;
  navigation: NavigationPublicPluginStart;
}

export async function mountManagementSection(
  getStartServices: StartServicesAccessor<DataSourceManagementStartDependencies>,
  params: ManagementAppMountParams & {
    wrapInPage?: boolean;
    setHeaderActionMenu: (menuMount: MountPoint | undefined) => void;
  },
  authMethodsRegistry: AuthenticationMethodRegistry,
  featureFlagStatus: boolean
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
    { navigation },
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
    navigation,
    setBreadcrumbs: params.setBreadcrumbs,
    authenticationMethodRegistry: authMethodsRegistry,
    workspaces,
  };

  const canManageDataSource = !!application.capabilities?.dataSource?.canManage;
  const useNewUX = uiSettings.get('home:useNewHomePage');

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
            useNewUX={useNewUX}
            savedObjects={savedObjects}
            setHeaderActionMenu={params.setHeaderActionMenu}
          />
        </Route>
        {canManageDataSource && (
          <Route path={['/create']}>
            <CreateDataSourcePanel
              {...params}
              featureFlagStatus={featureFlagStatus}
              useNewUX={useNewUX}
            />
          </Route>
        )}
        {featureFlagStatus && canManageDataSource && (
          <Route path={['/configure/OpenSearch']}>
            <CreateDataSourceWizardWithRouter />
          </Route>
        )}
        {canManageDataSource && (
          <Route path={['/configure/:type']}>
            <ConfigureDirectQueryDataSourceWithRouter
              notifications={notifications}
              useNewUX={useNewUX}
            />
          </Route>
        )}
        {featureFlagStatus && (
          <Route path={['/:id']}>
            <EditDataSourceWithRouter />
          </Route>
        )}
        <Route path={['/']}>
          <DataSourceHomePanel
            history={params.history}
            featureFlagStatus={featureFlagStatus}
            useNewUX={useNewUX}
          />
        </Route>
      </Switch>
    </Router>
  );

  ReactDOM.render(
    <OpenSearchDashboardsContextProvider services={deps}>
      <I18nProvider>
        {params.wrapInPage ? (
          <EuiPageContent hasShadow={false} hasBorder={false} color="transparent" paddingSize="m">
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
