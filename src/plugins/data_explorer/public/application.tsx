/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createRoot } from 'react-dom/client';
import { Provider as ReduxProvider } from 'react-redux';
import { Router, Route, Switch } from 'react-router-dom';
import { AppMountParameters, CoreStart } from '../../../core/public';
import { OpenSearchDashboardsContextProvider } from '../../opensearch_dashboards_react/public';
import { DataExplorerServices } from './types';
import { DataExplorerApp } from './components/app';
import { AppErrorBoundary } from './components/app_error_boundary';
import { Store } from './utils/state_management';

export const renderApp = (
  core: CoreStart,
  services: DataExplorerServices,
  params: AppMountParameters,
  store: Store
) => {
  const { history, element } = params;
  const root = createRoot(element);
  root.render(
    <Router history={history}>
      <OpenSearchDashboardsContextProvider services={services}>
        <ReduxProvider store={store}>
          <services.i18n.Context>
            <AppErrorBoundary history={history}>
              <Switch>
                <Route path={[`/:appId`, '/']} exact={false}>
                  <DataExplorerApp params={params} />
                </Route>
              </Switch>
            </AppErrorBoundary>
          </services.i18n.Context>
        </ReduxProvider>
      </OpenSearchDashboardsContextProvider>
    </Router>
  );

  return () => root.unmount();
};
