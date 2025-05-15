/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { AppMountParameters, CoreStart } from '../../../src/core/public';
import { AppPluginStartDependencies } from './types';
import { StateManagementExampleApp } from './components/app';
import { PluginStoreProvider } from '../../../src/plugins/opensearch_dashboards_react/public';

export const renderApp = (
  { notifications, http }: CoreStart,
  { navigation }: AppPluginStartDependencies,
  { appBasePath, element }: AppMountParameters
) => {
  ReactDOM.render(
    <PluginStoreProvider>
      <StateManagementExampleApp
        basename={appBasePath}
        notifications={notifications}
        http={http}
        navigation={navigation}
      />
    </PluginStoreProvider>,
    element
  );

  return () => ReactDOM.unmountComponentAtNode(element);
};
