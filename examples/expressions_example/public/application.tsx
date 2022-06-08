/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { AppMountParameters, CoreStart } from '../../../src/core/public';
import { ExpressionsExampleStartDependencies } from './types';
import { ExpressionsExampleApp } from './components/app';
import { OpenSearchDashboardsContextProvider } from '../../../src/plugins/opensearch_dashboards_react/public';

export const renderApp = (
  { notifications, http }: CoreStart,
  { navigation, expressions }: ExpressionsExampleStartDependencies,
  { appBasePath, element }: AppMountParameters
) => {
  const services = { expressions, notifications };
  ReactDOM.render(
    <OpenSearchDashboardsContextProvider services={services}>
      <ExpressionsExampleApp
        basename={appBasePath}
        notifications={notifications}
        http={http}
        navigation={navigation}
      />
    </OpenSearchDashboardsContextProvider>,
    element
  );

  return () => ReactDOM.unmountComponentAtNode(element);
};
