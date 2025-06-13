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
import { ExploreServices } from '../types';
import { LogsPage } from './pages/logs';
import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';
import { IndexPatternProvider } from './components/index_pattern_context';
import { ExploreFlavorId } from '../../common';
import { TracesPage } from './pages/traces';

// Route component props interface
interface ExploreRouteProps {
  services: ExploreServices;
  history: AppMountParameters['history'];
}

type ExploreComponentProps = ExploreRouteProps &
  Partial<Pick<AppMountParameters, 'setHeaderActionMenu'>>;

const renderExploreFlavor = (flavorId: ExploreFlavorId, props: ExploreComponentProps) => {
  switch (flavorId) {
    case 'logs':
      return <LogsPage setHeaderActionMenu={props.setHeaderActionMenu} />;
    case 'traces':
      return <TracesPage setHeaderActionMenu={props.setHeaderActionMenu} />;
    default:
      const invalidId: never = flavorId;
      return `Unexpected explore flavor id: ${invalidId}`;
  }
};

// View route for saved searches
const ViewRoute = (props: ExploreComponentProps) => (
  <LogsPage setHeaderActionMenu={props.setHeaderActionMenu} />
);

export const renderApp = (
  { element, history, setHeaderActionMenu }: AppMountParameters,
  services: ExploreServices,
  store: Store,
  flavorId: ExploreFlavorId
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

                <Route path={[`/`]} exact={false}>
                  {renderExploreFlavor(flavorId, mainRouteProps)}
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
