/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './app.scss';
import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { DashboardConstants, createDashboardEditUrl } from '../dashboard_constants';
import { DashboardEditor, DashboardListing, DashboardNoMatch } from './components';
import { DashboardServices } from '../types';
import { ExploreEditorWrapper } from './explore_editor_wrapper';

export const DashboardApp = () => {
  const { services } = useOpenSearchDashboards<DashboardServices>();
  const EditorComponent = services.editorRegistryService
    .start()
    .getEditor('exploreEditor')
    ?.render();

  return (
    <Switch>
      {/* Route for in-context Explore editor */}
      <Route path="/view_explore" exact={false}>
        <ExploreEditorWrapper EditorComponent={EditorComponent} services={services} />
      </Route>
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
