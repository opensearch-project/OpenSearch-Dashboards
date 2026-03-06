/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
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
import { useCurrentExploreId } from './utils/hooks/use_current_explore_id';

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

// Main component that handles saved search redirects
const ExploreMainRoute = (props: { flavor: ExploreFlavor } & ExploreComponentProps) => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const exploreId = useCurrentExploreId();
  const [shouldRender, setShouldRender] = useState(false);
  const [isChecking, setIsChecking] = useState(!!exploreId); // Only check if there's an ID

  // Check saved object type and redirect if it's a classic discover saved search
  useEffect(() => {
    const checkAndRedirect = async () => {
      if (!exploreId) {
        setShouldRender(true);
        setIsChecking(false);
        return;
      }

      try {
        // Try to load as explore saved object
        const savedObject = await services.getSavedExploreById(exploreId);

        // Check if this is actually a saved search (old discover format)
        if (savedObject.getOpenSearchType() === 'search') {
          // Redirect old saved search to classic discover
          services.core.application.navigateToApp('discover', {
            path: `#/view/${exploreId}`,
            replace: true,
          });
          return; // Don't render the page
        }

        // It's a valid explore object, render the page
        setShouldRender(true);
      } catch (error) {
        // If error loading, might be a saved search type, try redirecting to discover
        // This handles the case where getSavedExploreById only looks for 'explore' type
        services.core.application.navigateToApp('discover', {
          path: `#/view/${exploreId}`,
          replace: true,
        });
        return; // Don't render the page
      } finally {
        setIsChecking(false);
      }
    };

    checkAndRedirect();
  }, [exploreId, services]);

  // Show loading while checking, don't render page until we confirm it's safe
  if (isChecking) {
    return <div>Checking saved object type...</div>;
  }

  // If we're not supposed to render (redirect happened), return null
  if (!shouldRender && exploreId) {
    return null;
  }

  // Render the appropriate flavor
  return renderExploreFlavor(props.flavor, props);
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
          <EditorContextProvider>
            <DatasetProvider>
              <services.core.i18n.Context>
                <ExplorePageContextProvider>
                  <Switch>
                    {flavor === ExploreFlavor.Traces && (
                      <Route path="/traceDetails" exact={false}>
                        <TraceDetails setMenuMountPoint={setHeaderActionMenu} />
                      </Route>
                    )}

                    <Route path={[`/`]} exact={false}>
                      <ExploreMainRoute flavor={flavor} {...mainRouteProps} />
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
