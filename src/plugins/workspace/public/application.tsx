/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter as Router, Route, Switch } from 'react-router-dom';
import { AppMountParameters, ScopedHistory } from '../../../core/public';
import { OpenSearchDashboardsContextProvider } from '../../opensearch_dashboards_react/public';
import { WorkspaceFatalError } from './components/workspace_fatal_error';
import { WorkspaceCreatorApp } from './components/workspace_creator_app';
import { WorkspaceListApp, WorkspaceListAppProps } from './components/workspace_list_app';
import { Services } from './types';
import { WorkspaceCreatorProps } from './components/workspace_creator/workspace_creator';
import { WorkspaceDetailApp } from './components/workspace_detail_app';
import { WorkspaceDetailProps } from './components/workspace_detail/workspace_detail';
import { WorkspaceInitialApp } from './components/workspace_initial_app';

export const renderCreatorApp = (
  { element }: AppMountParameters,
  services: Services,
  props: WorkspaceCreatorProps
) => {
  ReactDOM.render(
    <OpenSearchDashboardsContextProvider services={services}>
      <WorkspaceCreatorApp {...props} />
    </OpenSearchDashboardsContextProvider>,
    element
  );

  return () => {
    ReactDOM.unmountComponentAtNode(element);
  };
};

export const renderFatalErrorApp = (params: AppMountParameters, services: Services) => {
  const { element } = params;
  const history = params.history as ScopedHistory<{ error?: string }>;
  ReactDOM.render(
    <OpenSearchDashboardsContextProvider services={services}>
      <WorkspaceFatalError error={history.location.state?.error} />
    </OpenSearchDashboardsContextProvider>,
    element
  );

  return () => {
    ReactDOM.unmountComponentAtNode(element);
  };
};
export const renderListApp = (
  { element }: AppMountParameters,
  services: Services,
  props: WorkspaceListAppProps
) => {
  ReactDOM.render(
    <OpenSearchDashboardsContextProvider services={services}>
      <WorkspaceListApp {...props} />
    </OpenSearchDashboardsContextProvider>,
    element
  );

  return () => {
    ReactDOM.unmountComponentAtNode(element);
  };
};

export const renderDetailApp = (
  { element }: AppMountParameters,
  services: Services,
  props: WorkspaceDetailProps
) => {
  ReactDOM.render(
    <OpenSearchDashboardsContextProvider services={services}>
      <Router>
        <Switch>
          <Route>
            <WorkspaceDetailApp {...props} />
          </Route>
        </Switch>
      </Router>
    </OpenSearchDashboardsContextProvider>,
    element
  );

  return () => {
    ReactDOM.unmountComponentAtNode(element);
  };
};

export const renderInitialApp = ({}: AppMountParameters, services: Services) => {
  const rootElement = document.getElementById('opensearch-dashboards-body');

  ReactDOM.render(
    <OpenSearchDashboardsContextProvider services={services}>
      <WorkspaceInitialApp />
    </OpenSearchDashboardsContextProvider>,
    rootElement
  );

  return () => {
    ReactDOM.unmountComponentAtNode(rootElement!);
  };
};
