/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, Switch } from 'react-router-dom';
import { AppMountParameters, CoreStart } from '../../../core/public';
import { OpenSearchDashboardsContextProvider } from '../../opensearch_dashboards_react/public';
import { DataExplorerServices } from './types';
import { DataExplorerApp } from './components/app';

export const renderApp = (
  { notifications, http }: CoreStart,
  services: DataExplorerServices,
  { appBasePath, element, history }: AppMountParameters
) => {
  ReactDOM.render(
    <Router history={history}>
      <OpenSearchDashboardsContextProvider services={services}>
        <services.i18n.Context>
          <Switch>
            <Route path={[`/:appId`, '/']} exact={false}>
              <DataExplorerApp
                basename={appBasePath}
                notifications={notifications}
                http={http}
                history={history}
              />
            </Route>
          </Switch>
        </services.i18n.Context>
      </OpenSearchDashboardsContextProvider>
    </Router>,
    element
  );

  return () => ReactDOM.unmountComponentAtNode(element);
};
