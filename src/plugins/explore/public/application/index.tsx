/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, Switch } from 'react-router-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { Store } from 'redux';
import { AppMountParameters } from '../../../../core/public';
import { ExploreServices, ExploreSetupDependencies } from '../types';
import { LogsPage } from './pages/logs';
import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';
import { IndexPatternProvider } from './components/index_pattern_context';
import { ExploreFlavor } from '../../common';
import { TracesPage } from './pages/traces';
import { MetricsPage } from './pages/metrics';
import { DataPublicPluginSetup } from '../../../../plugins/data/public';

// Route component props interface
interface ExploreRouteProps {
  services: ExploreServices;
  history: AppMountParameters['history'];
}

type ExploreComponentProps = ExploreRouteProps &
  Partial<Pick<AppMountParameters, 'setHeaderActionMenu'>> & { dataSetup: DataPublicPluginSetup };

const renderExploreFlavor = (flavor: ExploreFlavor, props: ExploreComponentProps) => {
  switch (flavor) {
    case ExploreFlavor.Logs:
      return (
        <LogsPage setHeaderActionMenu={props.setHeaderActionMenu} dataSetup={props.dataSetup} />
      );
    case ExploreFlavor.Traces:
      return (
        <TracesPage setHeaderActionMenu={props.setHeaderActionMenu} dataSetup={props.dataSetup} />
      );
    case ExploreFlavor.Metrics:
      return (
        <MetricsPage setHeaderActionMenu={props.setHeaderActionMenu} dataSetup={props.dataSetup} />
      );
    default:
      // This code should never be reached at runtime, it exists to make the
      // switch cases exhaustive
      const invalidId: never = flavor;
      return `Unexpected explore flavor id: ${invalidId}`;
  }
};

// View route for saved searches
const ViewRoute = (props: ExploreComponentProps) => (
  <LogsPage setHeaderActionMenu={props.setHeaderActionMenu} dataSetup={props.dataSetup} />
);

export const renderApp = (
  { element, history, setHeaderActionMenu }: AppMountParameters,
  services: ExploreServices,
  store: Store,
  flavor: ExploreFlavor,
  setupDeps: ExploreSetupDependencies
) => {
  // Create main route props
  const mainRouteProps = {
    services,
    history,
    setHeaderActionMenu,
    dataSetup: setupDeps.data,
  };
  ReactDOM.render(
    <Router history={history}>
      <OpenSearchDashboardsContextProvider services={services}>
        <ReduxProvider store={store}>
          <IndexPatternProvider>
            <services.core.i18n.Context>
              <Switch>
                {/* View route for saved searches */}
                {/* TODO: Do we need this? We might not need to, please revisit */}
                <Route path="/view/:id" exact>
                  <ViewRoute {...mainRouteProps} dataSetup={setupDeps.data} />
                </Route>

                <Route path={[`/`]} exact={false}>
                  {renderExploreFlavor(flavor, mainRouteProps)}
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
