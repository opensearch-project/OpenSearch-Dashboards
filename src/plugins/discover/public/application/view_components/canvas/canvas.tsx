/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { AppMountParameters } from '../../../../../../core/public';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { DiscoverServices } from '../../../build_services';
import { TopNav } from './top_nav';
import { updateState, useDispatch, useSelector } from '../../utils/state_management';
import { connectStorageToQueryState, opensearchFilters } from '../../../../../data/public';

interface CanvasProps {
  opts: {
    setHeaderActionMenu: AppMountParameters['setHeaderActionMenu'];
  };
}

export const Canvas = ({ opts }: CanvasProps) => {
  const { services } = useOpenSearchDashboards<DiscoverServices>();
  const interval = useSelector((state) => state.discover.interval);
  const dispatch = useDispatch();

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
      Interval:
      <input
        type="text"
        name=""
        id="temp"
        value={interval}
        onChange={(e) => {
          dispatch(updateState({ interval: e.target.value }));
        }}
      />
      <p>Services: {services.docLinks.DOC_LINK_VERSION}</p>
    </div>
  );
};
