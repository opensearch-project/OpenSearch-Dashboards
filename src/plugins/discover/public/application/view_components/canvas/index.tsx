/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { ViewMountParameters } from '../../../../../data_explorer/public';
import { OpenSearchDashboardsContextProvider } from '../../../../../opensearch_dashboards_react/public';
import { DiscoverServices } from '../../../build_services';

export const renderCanvas = (
  { canvasElement }: ViewMountParameters,
  services: DiscoverServices
) => {
  ReactDOM.render(
    <OpenSearchDashboardsContextProvider services={services}>
      {/* This is dummy code, inline styles will not be added in production */}
      <div style={{ whiteSpace: 'pre-wrap' }}>
        {JSON.stringify(services.capabilities.navLinks, null, 2)}
      </div>
    </OpenSearchDashboardsContextProvider>,
    canvasElement
  );

  return () => ReactDOM.unmountComponentAtNode(canvasElement);
};
