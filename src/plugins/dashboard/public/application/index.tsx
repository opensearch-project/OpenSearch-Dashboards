/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { Router } from 'react-router-dom';
import { AppMountParameters } from 'opensearch-dashboards/public';
import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';
import { usePageContext } from '../../../context_provider/public';
import { addHelpMenuToAppChrome } from './utils';
import { DashboardApp } from './app';
import { DashboardServices } from '../types';
export * from './embeddable';
export * from './actions';

// Parse the dashboard saved-object id
const getDashboardIdFromHash = (hash: string): string | undefined => {
  const match = hash.match(/#\/view\/([^/?]+)/);
  return match ? match[1] : undefined;
};

// register the dashboard page context
const DashboardPageContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  usePageContext({
    description: 'Dashboard application page context',
    convert: (urlState: any) => ({
      appId: 'dashboards',
      dashboardId: getDashboardIdFromHash(urlState.hash || ''),
      timeRange: urlState._g?.time,
    }),
    categories: ['page', 'static'],
  });

  return <>{children}</>;
};

export const renderApp = ({ element }: AppMountParameters, services: DashboardServices) => {
  addHelpMenuToAppChrome(services.chrome, services.docLinks);

  const app = (
    <Router history={services.history}>
      <OpenSearchDashboardsContextProvider services={services}>
        <services.i18n.Context>
          <DashboardPageContextProvider>
            <DashboardApp />
          </DashboardPageContextProvider>
        </services.i18n.Context>
      </OpenSearchDashboardsContextProvider>
    </Router>
  );

  const root = createRoot(element);
  root.render(app);

  return () => root.unmount();
};
