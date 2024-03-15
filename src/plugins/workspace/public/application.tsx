/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { AppMountParameters, ScopedHistory } from '../../../core/public';
import { OpenSearchDashboardsContextProvider } from '../../opensearch_dashboards_react/public';
import { WorkspaceFatalError } from './components/workspace_fatal_error';
import { Services } from './types';

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
