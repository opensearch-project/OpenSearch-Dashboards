/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { AppMountParameters, ScopedHistory } from '../../../core/public';
import { OpenSearchDashboardsContextProvider } from '../../opensearch_dashboards_react/public';
import { WorkspaceFatalError } from './components/workspace_fatal_error';
import { WorkspaceCreatorApp } from './components/workspace_creator_app';
import { WorkspaceUpdaterApp } from './components/workspace_updater_app';
import { WorkspaceListApp } from './components/workspace_list_app';
import { WorkspaceUpdaterProps } from './components/workspace_updater';
import { Services } from './types';
import { WorkspaceCreatorProps } from './components/workspace_creator/workspace_creator';
import { WorkspaceOverviewApp } from './components/workspace_overview_app';
import { WorkspaceOverviewProps } from './components/workspace_overview/workspace_overview';

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

export const renderUpdaterApp = (
  { element }: AppMountParameters,
  services: Services,
  props: WorkspaceUpdaterProps
) => {
  ReactDOM.render(
    <OpenSearchDashboardsContextProvider services={services}>
      <WorkspaceUpdaterApp {...props} />
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
export const renderListApp = ({ element }: AppMountParameters, services: Services) => {
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

export const renderOverviewApp = (
  { element }: AppMountParameters,
  services: Services,
  props: WorkspaceOverviewProps
) => {
  ReactDOM.render(
    <OpenSearchDashboardsContextProvider services={services}>
      <WorkspaceOverviewApp {...props} />
    </OpenSearchDashboardsContextProvider>,
    element
  );

  return () => {
    ReactDOM.unmountComponentAtNode(element);
  };
};
