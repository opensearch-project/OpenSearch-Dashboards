/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { Router } from 'react-router-dom';

import { AppMountParameters, CoreStart } from '../../../core/public';
import { OpenSearchDashboardsContextProvider } from '../../../plugins/opensearch_dashboards_react/public';
import { WorkspaceApp } from './components/workspace_app';

interface Service extends CoreStart {}

export const renderApp = (
  { element, history, appBasePath }: AppMountParameters,
  services: Service
) => {
  ReactDOM.render(
    <Router history={history}>
      <OpenSearchDashboardsContextProvider services={services}>
        <WorkspaceApp appBasePath={appBasePath} />
      </OpenSearchDashboardsContextProvider>
    </Router>,
    element
  );

  return () => {
    ReactDOM.unmountComponentAtNode(element);
  };
};
