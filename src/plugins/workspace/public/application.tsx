/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
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
import { WorkspaceUseCaseOverviewApp } from './components/workspace_use_case_overview_app';
import { WorkspaceInitialProps } from './components/workspace_initial/workspace_initial';
import { WorkspaceCollaboratorsApp } from './components/workspace_collaborators_app';

export const renderCreatorApp = (
  { element }: AppMountParameters,
  services: Services,
  props: WorkspaceCreatorProps
) => {
  const root = createRoot(element);
  root.render(
    <OpenSearchDashboardsContextProvider services={services}>
      <Router>
        <Switch>
          <Route>
            <WorkspaceCreatorApp {...props} />
          </Route>
        </Switch>
      </Router>
    </OpenSearchDashboardsContextProvider>
  );

  return () => {
    root.unmount();
  };
};

export const renderFatalErrorApp = (params: AppMountParameters, services: Services) => {
  const { element } = params;
  const history = params.history as ScopedHistory<{ error?: string }>;
  const root = createRoot(element);
  root.render(
    <OpenSearchDashboardsContextProvider services={services}>
      <WorkspaceFatalError error={history.location.state?.error} />
    </OpenSearchDashboardsContextProvider>
  );

  return () => {
    root.unmount();
  };
};
export const renderListApp = (
  { element }: AppMountParameters,
  services: Services,
  props: WorkspaceListAppProps
) => {
  const root = createRoot(element);
  root.render(
    <OpenSearchDashboardsContextProvider services={services}>
      <Router>
        <Switch>
          <Route>
            <WorkspaceListApp {...props} />
          </Route>
        </Switch>
      </Router>
    </OpenSearchDashboardsContextProvider>
  );

  return () => {
    root.unmount();
  };
};

export const renderDetailApp = (
  { element, onAppLeave }: AppMountParameters,
  services: Services,
  props: WorkspaceDetailProps
) => {
  const root = createRoot(element);
  root.render(
    <OpenSearchDashboardsContextProvider services={services}>
      <Router>
        <Switch>
          <Route>
            <WorkspaceDetailApp {...props} onAppLeave={onAppLeave} />
          </Route>
        </Switch>
      </Router>
    </OpenSearchDashboardsContextProvider>
  );

  return () => {
    root.unmount();
  };
};

export const renderInitialApp = (
  { element }: AppMountParameters,
  services: Services,
  props: WorkspaceInitialProps
) => {
  const root = createRoot(element);
  root.render(
    <OpenSearchDashboardsContextProvider services={services}>
      <WorkspaceInitialApp {...props} />
    </OpenSearchDashboardsContextProvider>
  );

  return () => {
    root.unmount();
  };
};

export const renderUseCaseOverviewApp = async (
  { element }: AppMountParameters,
  services: Omit<Services, 'collaboratorTypes'>,
  pageId: string
) => {
  const root = createRoot(element);
  root.render(
    <OpenSearchDashboardsContextProvider services={services}>
      <WorkspaceUseCaseOverviewApp pageId={pageId} />
    </OpenSearchDashboardsContextProvider>
  );

  return () => {
    root.unmount();
  };
};

export const renderCollaboratorsApp = (
  { element }: AppMountParameters,
  services: Services,
  props: {}
) => {
  const root = createRoot(element);
  root.render(
    <OpenSearchDashboardsContextProvider services={services}>
      <WorkspaceCollaboratorsApp {...props} />
    </OpenSearchDashboardsContextProvider>
  );

  return () => {
    root.unmount();
  };
};
