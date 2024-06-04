/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AppMountParameters } from '../../../../core/public';
import { useView } from '../utils/use';
import { AppContainer } from './app_container';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { DataExplorerServices } from '../types';
import { syncQueryStateWithUrl } from '../../../data/public';

export const DataExplorerApp = ({ params }: { params: AppMountParameters }) => {
  const { view } = useView();
  const {
    services: {
      data: { query },
      osdUrlStateStorage,
    },
  } = useOpenSearchDashboards<DataExplorerServices>();
  const { pathname } = useLocation();

  useEffect(() => {
    // syncs `_g` portion of url with query services
    const { stop } = syncQueryStateWithUrl(query, osdUrlStateStorage);

    return () => stop();

    // this effect should re-run when pathname is changed to preserve querystring part,
    // so the global state is always preserved
  }, [query, osdUrlStateStorage, pathname]);

  return <AppContainer view={view} params={params} />;
};
