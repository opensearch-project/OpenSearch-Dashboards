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

import * as React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { Router, Switch, Route, Link } from 'react-router-dom';
import { CoreSetup, Plugin } from 'opensearch-dashboards/public';

export class DashboardListingTestPlugin
  implements Plugin<DashboardListingTestPluginSetup, DashboardListingTestPluginStart> {
  public setup(core: CoreSetup, setupDeps: SetupDependencies) {
    const ID = 'dashboard_listing_test_plugin';
    const BASE_URL = core.http.basePath.prepend(`/app/${ID}#`);
    setupDeps.dashboard.registerDashboardProvider({
      appId: ID,
      savedObjectsType: 'dashboardTest',
      savedObjectsName: 'Dashboard Test',
      editUrlPathFn: (obj: SavedObject) => `${BASE_URL}/${obj.id}/edit`,
      viewUrlPathFn: (obj: SavedObject) => `${BASE_URL}/${obj.id}`,
      createLinkText: 'Test Dashboard',
      createSortText: 'Test Dashboard',
      createUrl: `${BASE_URL}/create`,
    });

    core.application.register({
      id: ID,
      title: 'Dashboard Listing Test Plugin',
      appRoute: `app/${ID}`,
      async mount(context, { element }) {
        render(
          <h1 data-test-subj="dashboardListingTestHeader">Dashboard Listing Test Header</h1>,
          element
        );

        return () => unmountComponentAtNode(element);
      },
    });
  }

  public start() {}
  public stop() {}
}

export type DashboardListingTestPluginSetup = ReturnType<DashboardListingTestPlugin['setup']>;
export type DashboardListingTestPluginStart = ReturnType<DashboardListingTestPlugin['start']>;
