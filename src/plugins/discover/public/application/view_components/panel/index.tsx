/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { ViewMountParameters } from '../../../../../data_explorer/public';
import { OpenSearchDashboardsContextProvider } from '../../../../../opensearch_dashboards_react/public';
import { DiscoverServices } from '../../../build_services';

export const renderPanel = ({ panelElement }: ViewMountParameters, services: DiscoverServices) => {
  ReactDOM.render(
    <OpenSearchDashboardsContextProvider services={services}>
      <div>Side panel</div>
    </OpenSearchDashboardsContextProvider>,
    panelElement
  );

  return () => ReactDOM.unmountComponentAtNode(panelElement);
};
