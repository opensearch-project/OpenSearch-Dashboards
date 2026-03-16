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
import { AgentTracesServices } from '../types';
import {
  OpenSearchDashboardsContextProvider,
  useOpenSearchDashboards,
} from '../../../opensearch_dashboards_react/public';
import { DatasetProvider } from './context';
import { TracesPage } from './pages/traces';
import { EditorContextProvider } from './context';

const NOOP_PAGE_CONTEXT_HOOK = (_options?: any): string => '';

// Component that handles page context for all Agent Traces flavors
const AgentTracesPageContextProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { services } = useOpenSearchDashboards<AgentTracesServices>();
  const usePageContext = services.contextProvider?.hooks?.usePageContext || NOOP_PAGE_CONTEXT_HOOK;
  usePageContext({
    description: 'Agent Traces application page context',
    convert: (urlState: any) => ({
      appId: 'agentTraces',
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

export const renderApp = (
  { element, history, setHeaderActionMenu }: AppMountParameters,
  services: AgentTracesServices,
  store: Store
) => {
  const root = createRoot(element);
  root.render(
    <Router history={history}>
      <OpenSearchDashboardsContextProvider services={services}>
        <ReduxProvider store={store}>
          <EditorContextProvider>
            <DatasetProvider>
              <services.core.i18n.Context>
                <AgentTracesPageContextProvider>
                  <Switch>
                    {/* View route for saved searches */}
                    <Route path="/view/:id" exact>
                      <TracesPage setHeaderActionMenu={setHeaderActionMenu} />
                    </Route>

                    <Route path={[`/`]} exact={false}>
                      <TracesPage setHeaderActionMenu={setHeaderActionMenu} />
                    </Route>
                  </Switch>
                </AgentTracesPageContextProvider>
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
