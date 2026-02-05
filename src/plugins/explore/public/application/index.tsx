/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { Router, Route, Switch } from 'react-router-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { Store } from 'redux';
import { AppMountParameters } from '../../../../core/public';
import { ExploreServices } from '../types';
import { LogsPage } from './pages/logs';
import {
  OpenSearchDashboardsContextProvider,
  useOpenSearchDashboards,
} from '../../../opensearch_dashboards_react/public';
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

const NOOP_PAGE_CONTEXT_HOOK = (options?: any): string => '';

// Component that handles page context for all Explore flavors
const ExplorePageContextProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const usePageContext = services.contextProvider?.hooks?.usePageContext || NOOP_PAGE_CONTEXT_HOOK;
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
    categories: ['page', 'static'],
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
  const root = createRoot(element);
  root.render(
    <Router history={history}>
      <OpenSearchDashboardsContextProvider services={services}>
        <ReduxProvider store={store}>
          {/* @ts-expect-error TS2559 TODO(ts-error): fixme */}
          <EditorContextProvider>
            <DatasetProvider>
              <services.core.i18n.Context>
                <ExplorePageContextProvider>
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
    </Router>
  );

  return () => {
    root.unmount();
  };
};
