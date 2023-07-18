/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppMountParameters } from '../../../../../../core/public';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { DiscoverServices } from '../../../build_services';
import { TopNav } from './top_nav';

interface CanvasProps {
  opts: {
    setHeaderActionMenu: AppMountParameters['setHeaderActionMenu'];
  };
}

export const Canvas = ({ opts }: CanvasProps) => {
  const { services } = useOpenSearchDashboards<DiscoverServices>();

  return (
    <div>
      <TopNav opts={opts} />
      Canvas
    </div>
  );
};
