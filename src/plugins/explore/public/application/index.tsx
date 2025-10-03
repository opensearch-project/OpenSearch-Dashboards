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
import { DatasetProvider } from './context';
import { ExploreFlavor } from '../../common';
import { TracesPage } from './pages/traces';
import { MetricsPage } from './pages/metrics';
import { EditorContextProvider } from './context';
import { TraceDetails } from './pages/traces/trace_details/trace_view';

// Route component props interface
interface ExploreRouteProps {
  services: ExploreServices;
  history: AppMountParameters['history'];
}

type ExploreComponentProps = ExploreRouteProps &
  Partial<Pick<AppMountParameters, 'setHeaderActionMenu'>>;

// Component that handles page context for all Explore flavors
const ExplorePageContextProvider: React.FC<{
  children: React.ReactNode;
  services: ExploreServices;
}> = ({ children, services }) => {
  const usePageContext = services.contextProvider?.hooks?.usePageContext || (() => {});

  usePageContext({
    description: 'Explore application page context',
    convert: (urlState: any) => ({
      appId: 'explore',
      timeRange: urlState._g?.time,
      query: {
        query: urlState._q?.query || '',
        language: urlState._q?.language || 'PPL',
      },
      dataset: urlState._q?.dataset,
    }),
    categories: ['static', 'explore'],
  });

  return <>{children}</>;
};

const renderExploreFlavor = (flavor: ExploreFlavor, props: ExploreComponentProps) => {
  switch (flavor) {
    case ExploreFlavor.Logs:
      return <LogsPage setHeaderActionMenu={props.setHeaderActionMenu} />;
    case ExploreFlavor.Traces:
      return <TracesPage setHeaderActionMenu={props.setHeaderActionMenu} />;
    case ExploreFlavor.Metrics:
      return <MetricsPage setHeaderActionMenu={props.setHeaderActionMenu} />;
    default:
      // This code should never be reached at runtime, it exists to make the
      // switch cases exhaustive
      const invalidId: never = flavor;
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
  flavor: ExploreFlavor
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
          <EditorContextProvider>
            <DatasetProvider>
              <services.core.i18n.Context>
                <ExplorePageContextProvider services={services}>
                  <Switch>
                    {/* View route for saved searches */}
                    {/* TODO: Do we need this? We might not need to, please revisit */}
                    <Route path="/view/:id" exact>
                      <ViewRoute {...mainRouteProps} />
                    </Route>

                    {flavor === ExploreFlavor.Traces && (
                      <Route path="/traceDetails" exact={false}>
                        <TraceDetails setMenuMountPoint={setHeaderActionMenu} />
                      </Route>
                    )}

                    <Route path={[`/`]} exact={false}>
                      {renderExploreFlavor(flavor, mainRouteProps)}
                    </Route>
                  </Switch>
                </ExplorePageContextProvider>
              </services.core.i18n.Context>
            </DatasetProvider>
          </EditorContextProvider>
        </ReduxProvider>
      </OpenSearchDashboardsContextProvider>
    </Router>,
    element
  );

  return () => {
    ReactDOM.unmountComponentAtNode(element);
  };
};
