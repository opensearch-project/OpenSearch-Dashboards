/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, Switch, Redirect } from 'react-router-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { Store } from 'redux';
import { AppMountParameters } from '../../../../core/public';
import { ExploreServices } from '../types';
import { LogsPage } from './pages/logs/logs_page';
import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';
import { IndexPatternProvider } from './components/index_pattern_context';
import { LOGS_VIEW_ID, TRACES_VIEW_ID } from '../../common';

// Route component props interface
interface ExploreRouteProps {
  services: ExploreServices;
  history: AppMountParameters['history'];
}

// Route components for different paths
const ExploreLogsRoute = (
  props: ExploreRouteProps & Pick<AppMountParameters, 'setHeaderActionMenu'>
) => <LogsPage setHeaderActionMenu={props.setHeaderActionMenu} />;
const ExploreTracesRoute = (
  props: ExploreRouteProps & Pick<AppMountParameters, 'setHeaderActionMenu'>
) => <LogsPage setHeaderActionMenu={props.setHeaderActionMenu} />;

// View route for saved searches
const ViewRoute = (props: ExploreRouteProps & Pick<AppMountParameters, 'setHeaderActionMenu'>) => (
  <LogsPage setHeaderActionMenu={props.setHeaderActionMenu} />
);

export const renderApp = (
  { element, history, setHeaderActionMenu }: AppMountParameters,
  services: ExploreServices,
  store: Store
) => {
  // Create main route props
  const mainRouteProps = {
    services,
    history,
    setHeaderActionMenu,
  };
  ReactDOM.render(
    <Router history={history}>
      <OpenSearchDashboardsContextProvider services={services}>
        <ReduxProvider store={store}>
          <IndexPatternProvider>
            <services.core.i18n.Context>
              <Switch>
                {/* View route for saved searches */}
                <Route path="/view/:id" exact>
                  <ViewRoute {...mainRouteProps} />
                </Route>

                <Redirect from="/" to={`${LOGS_VIEW_ID}#/`} exact />

                <Route path={[`/${LOGS_VIEW_ID}`]} exact={false}>
                  <ExploreLogsRoute {...mainRouteProps} />
                </Route>
                <Route path={[`/${TRACES_VIEW_ID}`]} exact={false}>
                  <ExploreTracesRoute {...mainRouteProps} />
                </Route>
              </Switch>
            </services.core.i18n.Context>
          </IndexPatternProvider>
        </ReduxProvider>
      </OpenSearchDashboardsContextProvider>
    </Router>,
    element
  );

  return () => {
    ReactDOM.unmountComponentAtNode(element);
  };
};
