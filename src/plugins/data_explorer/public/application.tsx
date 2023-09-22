/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { Router, Route, Switch } from 'react-router-dom';
import { AppMountParameters, CoreStart } from '../../../core/public';
import { OpenSearchDashboardsContextProvider } from '../../opensearch_dashboards_react/public';
import { DataExplorerServices } from './types';
import { DataExplorerApp } from './components/app';
import { Store } from './utils/state_management';

export const renderApp = (
  core: CoreStart,
  services: DataExplorerServices,
  params: AppMountParameters,
  store: Store
) => {
  const { history, element } = params;
  ReactDOM.render(
    <Router history={history}>
      <OpenSearchDashboardsContextProvider services={services}>
        <ReduxProvider store={store}>
          <services.i18n.Context>
            <Switch>
              <Route path={[`/:appId`, '/']} exact={false}>
                <DataExplorerApp params={params} />
              </Route>
            </Switch>
          </services.i18n.Context>
        </ReduxProvider>
      </OpenSearchDashboardsContextProvider>
    </Router>,
    element
  );

  return () => ReactDOM.unmountComponentAtNode(element);
};
