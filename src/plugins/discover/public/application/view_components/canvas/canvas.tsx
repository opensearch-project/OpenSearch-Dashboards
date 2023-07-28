/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { AppMountParameters } from '../../../../../../core/public';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { DiscoverViewServices } from '../../../build_services';
import { TopNav } from './top_nav';
import { connectStorageToQueryState, opensearchFilters } from '../../../../../data/public';
import { DiscoverTable } from './discover_table';

interface CanvasProps {
  opts: {
    setHeaderActionMenu: AppMountParameters['setHeaderActionMenu'];
  };
}

export const Canvas = ({ opts }: CanvasProps) => {
  const { services } = useOpenSearchDashboards<DiscoverViewServices>();
  const { history: getHistory } = services;
  const history = getHistory();

  // Connect the query service to the url state
  useEffect(() => {
    connectStorageToQueryState(services.data.query, services.osdUrlStateStorage, {
      filters: opensearchFilters.FilterStateStore.APP_STATE,
      query: true,
    });
  }, [services.data.query, services.osdUrlStateStorage, services.uiSettings]);

  return (
    <div>
      <TopNav opts={opts} />
      <DiscoverTable services={services} history={history} />
    </div>
  );
};
