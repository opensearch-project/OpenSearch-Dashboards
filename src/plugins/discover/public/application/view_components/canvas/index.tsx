/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { ViewMountParameters } from '../../../../../data_explorer/public';
import { OpenSearchDashboardsContextProvider } from '../../../../../opensearch_dashboards_react/public';
import { DiscoverServices } from '../../../build_services';
import { Canvas } from './canvas';

export const renderCanvas = (
  { canvasElement, appParams }: ViewMountParameters,
  services: DiscoverServices
) => {
  const { setHeaderActionMenu } = appParams;

  ReactDOM.render(
    <OpenSearchDashboardsContextProvider services={services}>
      <Canvas
        opts={{
          setHeaderActionMenu,
        }}
      />
    </OpenSearchDashboardsContextProvider>,
    canvasElement
  );

  return () => ReactDOM.unmountComponentAtNode(canvasElement);
};
