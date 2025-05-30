/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { Router, Route, Switch, Redirect } from 'react-router-dom';
import { AppMountParameters, CoreStart } from 'opensearch-dashboards/public';
import { OpenSearchDashboardsContextProvider } from '../../opensearch_dashboards_react/public';
import { Store } from './utils/state_management';
import { LOGS_VIEW_ID } from '../common';
import { LogsPage } from './application/logs/logs_page';
import { DataExplorerServices } from './types';

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
            <div>WIP: this is rendered by the new explore plugin</div>
            <Switch>
              <Route exact path="/">
                <Redirect to={`${LOGS_VIEW_ID}#/`} />
              </Route>
              <Route path={[`/${LOGS_VIEW_ID}`]} exact={false}>
                <LogsPage params={params} />
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
