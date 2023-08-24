/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { AppMountParameters, ScopedHistory } from '../../../core/public';
import { OpenSearchDashboardsContextProvider } from '../../opensearch_dashboards_react/public';
import { WorkspaceListApp } from './components/workspace_list_app';
import { WorkspaceCreatorApp } from './components/workspace_creator_app';
import { WorkspaceUpdaterApp } from './components/workspace_updater_app';
import { WorkspaceOverviewApp } from './components/workspace_overview_app';
import { WorkspaceFatalError } from './components/workspace_fatal_error';
import { Services } from './types';

export const renderListApp = (
  { element, history, appBasePath }: AppMountParameters,
  services: Services
) => {
  ReactDOM.render(
    <OpenSearchDashboardsContextProvider services={services}>
      <WorkspaceListApp />
    </OpenSearchDashboardsContextProvider>,
    element
  );

  return () => {
    ReactDOM.unmountComponentAtNode(element);
  };
};
export const renderCreatorApp = (
  { element, history, appBasePath }: AppMountParameters,
  services: Services
) => {
  ReactDOM.render(
    <OpenSearchDashboardsContextProvider services={services}>
      <WorkspaceCreatorApp />
    </OpenSearchDashboardsContextProvider>,
    element
  );

  return () => {
    ReactDOM.unmountComponentAtNode(element);
  };
};

export const renderUpdateApp = (
  { element, history, appBasePath }: AppMountParameters,
  services: Services
) => {
  ReactDOM.render(
    <OpenSearchDashboardsContextProvider services={services}>
      <WorkspaceUpdaterApp />
    </OpenSearchDashboardsContextProvider>,
    element
  );

  return () => {
    ReactDOM.unmountComponentAtNode(element);
  };
};

export const renderOverviewApp = (
  { element, history, appBasePath }: AppMountParameters,
  services: Services
) => {
  ReactDOM.render(
    <OpenSearchDashboardsContextProvider services={services}>
      <WorkspaceOverviewApp />
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
      <WorkspaceFatalError error={history.location.state.error} />
    </OpenSearchDashboardsContextProvider>,
    element
  );

  return () => {
    ReactDOM.unmountComponentAtNode(element);
  };
};
