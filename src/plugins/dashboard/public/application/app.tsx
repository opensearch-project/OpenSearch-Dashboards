/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import './app.scss';
import { AppMountParameters } from 'opensearch-dashboards/public';
import React, { useEffect } from 'react';
import { Route, Switch, useLocation } from 'react-router-dom';
import { DashboardConstants, createDashboardEditUrl } from '../dashboard_constants';
import { DashboardEditor, DashboardListing, DashboardNoMatch } from './components';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { DashboardServices } from '../types';
import { syncQueryStateWithUrl } from '../../../data/public';

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

  useEffect(() => {
    // syncs `_g` portion of url with query services
    const { stop } = syncQueryStateWithUrl(query, osdUrlStateStorage);

    return () => stop();

    // this effect should re-run when pathname is changed to preserve querystring part,
    // so the global state is always preserved
  }, [query, osdUrlStateStorage, pathname]);

  return (
    <Switch>
      <Route path={[DashboardConstants.CREATE_NEW_DASHBOARD_URL, createDashboardEditUrl(':id')]}>
        <div className="app-container dshAppContainer">
          <DashboardEditor />
          <div id="dashboardViewport" />
        </div>
      </Route>
      <Route exact path={['/', DashboardConstants.LANDING_PAGE_PATH]}>
        <DashboardListing />
      </Route>
      <DashboardNoMatch />
    </Switch>
  );
};
