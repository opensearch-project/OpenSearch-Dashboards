/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
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
  const root = createRoot(element);
  root.render(
    <OpenSearchDashboardsContextProvider services={services}>
      <ExpressionsExampleApp
        basename={appBasePath}
        notifications={notifications}
        http={http}
        navigation={navigation}
      />
    </OpenSearchDashboardsContextProvider>
  );

  return () => root.unmount();
};
