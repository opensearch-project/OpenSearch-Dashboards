/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './app.scss';
import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { DashboardConstants, createDashboardEditUrl } from '../dashboard_constants';
import { DashboardEditor, DashboardListing, DashboardNoMatch } from './components';

export const DashboardApp = () => {
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
