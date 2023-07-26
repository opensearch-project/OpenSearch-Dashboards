/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { Router } from 'react-router-dom';
import { AppMountParameters } from 'opensearch-dashboards/public';
import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';
import { addHelpMenuToAppChrome } from './utils';
import { DashboardApp } from './app';
import { DashboardServices } from '../types';
export * from './embeddable';
export * from './actions';

export const renderApp = ({ element }: AppMountParameters, services: DashboardServices) => {
  addHelpMenuToAppChrome(services.chrome, services.docLinks);

  const app = (
    <Router history={services.history}>
      <OpenSearchDashboardsContextProvider services={services}>
        <services.i18n.Context>
          <DashboardApp />
        </services.i18n.Context>
      </OpenSearchDashboardsContextProvider>
    </Router>
  );

  ReactDOM.render(app, element);

  return () => ReactDOM.unmountComponentAtNode(element);
};
