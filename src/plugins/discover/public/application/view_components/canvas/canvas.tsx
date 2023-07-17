/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppMountParameters } from '../../../../../../core/public';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { DiscoverServices } from '../../../build_services';
import { TopNav } from './top_nav';
import { updateState, useDispatch, useSelector } from '../../utils/state_management';

interface CanvasProps {
  opts: {
    setHeaderActionMenu: AppMountParameters['setHeaderActionMenu'];
  };
}

export const Canvas = ({ opts }: CanvasProps) => {
  const { services } = useOpenSearchDashboards<DiscoverServices>();
  const interval = useSelector((state) => state.discover.interval);
  const dispatch = useDispatch();

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
