/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppMountParameters } from 'opensearch-dashboards/public';
import React, { useEffect } from 'react';
import { Route, Switch, useLocation } from 'react-router-dom';
import { DashboardConstants, createDashboardEditUrl } from '../dashboard_constants';
import { DashboardListing, DashboardEditor, DashboardNoMatch } from '../application/components';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { DashboardServices } from './types';
import { syncQueryStateWithUrl } from '../../../data/public';
import { DashboardViewport } from './embeddable/viewport/dashboard_viewport';

export interface DashboardAppProps {
  onAppLeave: AppMountParameters['onAppLeave'];
}

export const DashboardApp = ({ onAppLeave }: DashboardAppProps) => {
  const {
    services: {
      data: { query },
      osdUrlStateStorage,
    },
  } = useOpenSearchDashboards<DashboardServices>();
  const { pathname } = useLocation();
  console.log("pathname", pathname)

  useEffect(() => {
    // syncs `_g` portion of url with query services
    const { stop } = syncQueryStateWithUrl(query, osdUrlStateStorage);

    return () => stop();

    // this effect should re-run when pathname is changed to preserve querystring part,
    // so the global state is always preserved
  }, [query, osdUrlStateStorage, pathname]);

  return (
    <Switch>
      <Route exact path={['/', DashboardConstants.LANDING_PAGE_PATH]}>
        <DashboardListing />
      </Route>
      <Route
        exact
        path={[DashboardConstants.CREATE_NEW_DASHBOARD_URL, createDashboardEditUrl(':id')]}
      >
        <DashboardEditor />
      </Route>
      <DashboardNoMatch />
    </Switch>
  );
};
