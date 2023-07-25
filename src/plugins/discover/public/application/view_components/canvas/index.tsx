/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { ViewProps } from '../../../../../data_explorer/public';
import { OpenSearchDashboardsContextProvider } from '../../../../../opensearch_dashboards_react/public';
import { Canvas } from './canvas';
import { getServices } from '../../../opensearch_dashboards_services';
import { connectStorageToQueryState, opensearchFilters } from '../../../../../data/public';
import { createOsdUrlStateStorage } from '../../../../../opensearch_dashboards_utils/public';

// eslint-disable-next-line import/no-default-export
export default function CanvasApp({ setHeaderActionMenu, redirectState, history }: ViewProps) {
  const services = getServices();

  useEffect(() => {
    const osdUrlStateStorage = createOsdUrlStateStorage({
      history,
      useHash: services.uiSettings.get('state:storeInSessionStorage'),
    });
    connectStorageToQueryState(services.data.query, osdUrlStateStorage, {
      filters: opensearchFilters.FilterStateStore.APP_STATE,
      query: true,
    });
  }, [history, services.data.query, services.uiSettings]);

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
