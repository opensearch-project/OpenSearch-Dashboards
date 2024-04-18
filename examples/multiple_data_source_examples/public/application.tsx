/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import ReactDOM from 'react-dom';
import { DataSourcePluginSetup } from 'src/plugins/data_source/public';
import { DataSourceManagementPluginSetup } from 'src/plugins/data_source_management/public';
import { NavigationPublicPluginStart } from 'src/plugins/navigation/public';
import { CoreStart, AppMountParameters } from '../../../src/core/public';
import { Home } from './components/home';

export const renderApp = (
  { notifications, http, savedObjects, application, uiSettings }: CoreStart,
  dataSource: DataSourcePluginSetup,
  dataSourceManagement: DataSourceManagementPluginSetup,
  { appBasePath, element, setHeaderActionMenu }: AppMountParameters,
  navigation: NavigationPublicPluginStart
) => {
  ReactDOM.render(
    <Home
      basename={appBasePath}
      notifications={notifications}
      http={http}
      savedObjects={savedObjects}
      dataSourceEnabled={dataSource.dataSourceEnabled}
      setActionMenu={setHeaderActionMenu}
      dataSourceManagement={dataSourceManagement}
      navigateToApp={application.navigateToApp}
      navigation={navigation}
      uiSettings={uiSettings}
    />,
    element
  );

  return () => ReactDOM.unmountComponentAtNode(element);
};
