/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MountPoint, StartServicesAccessor } from 'src/core/public';

import { EuiPageContent } from '@elastic/eui';
import { I18nProvider } from '@osd/i18n/react';

import { createRoot } from 'react-dom/client';
import { Route, Router, Switch } from 'react-router-dom';
import { DataPublicPluginStart } from 'src/plugins/data/public';
import { ManagementAppMountParams } from '../../../management/public';

import { NavigationPublicPluginStart } from '../../../navigation/public';
import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';
import { AuthenticationMethodRegistry } from '../auth_registry';
import { IDirectQueryConnectionFlowRegistry } from '../direct_query_connection_flow_registry';
import { DirectQueryConnectionFlowMountPoint } from '../components/direct_query_connection_flow/direct_query_connection_flow_mount_point';
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
  featureFlagStatus: boolean,
  directQueryConnectionFlowRegistry?: IDirectQueryConnectionFlowRegistry
) {
  const [coreStart, { navigation }] = await getStartServices();
  const {
    chrome,
    application,
    savedObjects,
    uiSettings,
    notifications,
    overlays,
    http,
    docLinks,
    workspaces,
  } = coreStart;

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
    ...(directQueryConnectionFlowRegistry?.hasFlows() ? { directQueryConnectionFlowRegistry } : {}),
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
            {/* @ts-expect-error TS2739 TODO(ts-error): fixme */}
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
        {/* Registered even with no flow, so an old link to a flow lands on its "not available"
            callout instead of the data source edit page. */}
        {canManageDataSource && (
          <Route path={['/flows/:flowId', '/flows/:flowId/*']}>
            <DirectQueryConnectionFlowMountPoint
              registry={directQueryConnectionFlowRegistry}
              core={coreStart}
              history={params.history}
              setBreadcrumbs={params.setBreadcrumbs}
            />
          </Route>
        )}
        {featureFlagStatus && (
          <Route path={['/:id']}>
            <EditDataSourceWithRouter />
          </Route>
        )}
        <Route path={['/']}>
          {/* @ts-expect-error TS2739 TODO(ts-error): fixme */}
          <DataSourceHomePanel
            history={params.history}
            featureFlagStatus={featureFlagStatus}
            useNewUX={useNewUX}
          />
        </Route>
      </Switch>
    </Router>
  );

  const root = createRoot(params.element);
  root.render(
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
    </OpenSearchDashboardsContextProvider>
  );

  return () => {
    chrome.docTitle.reset();
    root.unmount();
  };
}
