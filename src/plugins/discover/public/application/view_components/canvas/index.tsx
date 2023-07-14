/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { ViewMountParameters } from '../../../../../data_explorer/public';
import { OpenSearchDashboardsContextProvider } from '../../../../../opensearch_dashboards_react/public';
import { DiscoverServices } from '../../../build_services';
import { Canvas } from './canvas';
import { contextDiscover } from '../../utils/state_management/discover_slice';

export const renderCanvas = (
  { canvasElement, appParams, store }: ViewMountParameters,
  services: DiscoverServices
) => {
  const { setHeaderActionMenu } = appParams;

  ReactDOM.render(
    <OpenSearchDashboardsContextProvider services={services}>
      <Provider context={contextDiscover} store={store}>
        <Canvas
          opts={{
            setHeaderActionMenu,
          }}
        />
      </Provider>
    </OpenSearchDashboardsContextProvider>,
    canvasElement
  );

  return () => ReactDOM.unmountComponentAtNode(canvasElement);
};
