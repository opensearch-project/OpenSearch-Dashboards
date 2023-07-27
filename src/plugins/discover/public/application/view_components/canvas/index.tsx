/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ViewProps } from '../../../../../data_explorer/public';
import { OpenSearchDashboardsContextProvider } from '../../../../../opensearch_dashboards_react/public';
import { Canvas } from './canvas';
import { getServices } from '../../../opensearch_dashboards_services';

// eslint-disable-next-line import/no-default-export
export default function CanvasApp({ setHeaderActionMenu }: ViewProps) {
  const services = getServices();

  return (
    <OpenSearchDashboardsContextProvider services={services}>
      <Canvas
        opts={{
          setHeaderActionMenu,
        }}
      />
    </OpenSearchDashboardsContextProvider>
  );
}
