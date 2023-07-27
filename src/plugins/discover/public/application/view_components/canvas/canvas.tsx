/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppMountParameters } from '../../../../../../core/public';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { DiscoverServices } from '../../../build_services';
import { TopNav } from './top_nav';
import { DiscoverTable } from './discover_table';

interface CanvasProps {
  opts: {
    setHeaderActionMenu: AppMountParameters['setHeaderActionMenu'];
  };
}

export const Canvas = ({ opts }: CanvasProps) => {
  const { services } = useOpenSearchDashboards<DiscoverServices>();
  const { history: getHistory } = services;
  const history = getHistory();
  return (
    <div>
      <TopNav opts={opts} />
      <DiscoverTable services={services} history={history} />
    </div>
  );
};
