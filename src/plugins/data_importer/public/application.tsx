/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { AppMountParameters, CoreStart } from '../../../core/public';
import { DataImporterPluginStartDependencies } from './types';
import { DataImporterPluginApp } from './components/data_importer_app';
import { PublicConfigSchema } from '../config';
import { DataImporterPluginSetupDeps } from './types';

export const renderApp = (
  { notifications, http, savedObjects, application }: CoreStart,
  { navigation }: DataImporterPluginStartDependencies,
  { appBasePath, element }: AppMountParameters,
  { dataSourceManagement }: DataImporterPluginSetupDeps,
  config: PublicConfigSchema
) => {
  const dataSourceEnabled = application.capabilities.dataSource?.enabled ?? false;
  const hideLocalCluster = application.capabilities.dataSource?.hideLocalCluster ?? false;

  ReactDOM.render(
    <DataImporterPluginApp
      basename={appBasePath}
      notifications={notifications}
      http={http}
      navigation={navigation}
      config={config}
      savedObjects={savedObjects}
      dataSourceEnabled={dataSourceEnabled}
      hideLocalCluster={hideLocalCluster}
      dataSourceManagement={dataSourceManagement}
    />,
    element
  );

  return () => ReactDOM.unmountComponentAtNode(element);
};
