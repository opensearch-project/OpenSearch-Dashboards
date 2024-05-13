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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { i18n } from '@osd/i18n';
import { from } from 'rxjs';
import { distinct, map, switchMap } from 'rxjs/operators';
import {
  AppMountParameters,
  CoreSetup,
  CoreStart,
  Plugin,
  DEFAULT_APP_CATEGORIES,
  AppStatus,
  AppNavLinkStatus,
  Branding,
  WorkspaceAvailability,
} from '../../../core/public';
import {
  OpenSearchDashboardsOverviewPluginSetup,
  OpenSearchDashboardsOverviewPluginStart,
  AppPluginSetupDependencies,
  AppPluginStartDependencies,
} from './types';
import { PLUGIN_ID, PLUGIN_NAME, PLUGIN_PATH, PLUGIN_ICON } from '../common';

/** @public */
export type OverviewPluginBranding = Branding;

export class OpenSearchDashboardsOverviewPlugin
  implements
    Plugin<
      OpenSearchDashboardsOverviewPluginSetup,
      OpenSearchDashboardsOverviewPluginStart,
      AppPluginSetupDependencies,
      AppPluginStartDependencies
    > {
  public setup(
    core: CoreSetup<AppPluginStartDependencies>,
    { home }: AppPluginSetupDependencies
  ): OpenSearchDashboardsOverviewPluginSetup {
    const appUpdater$ = from(core.getStartServices()).pipe(
      switchMap(([coreDeps]) => coreDeps.chrome.navLinks.getNavLinks$()),
      map((navLinks) => {
        const hasOpenSearchDashboardsApp = Boolean(
          navLinks.find(
            ({ id, category, hidden }) =>
              !hidden && category?.id === 'opensearchDashboards' && id !== PLUGIN_ID
          )
        );

        return hasOpenSearchDashboardsApp;
      }),
      distinct(),
      map((hasOpenSearchDashboardsApp) => {
        return () => {
          return { status: AppStatus.accessible, navLinkStatus: AppNavLinkStatus.default };
        };
      })
    );

    // Register an application into the side navigation menu
    core.application.register({
      category: DEFAULT_APP_CATEGORIES.opensearchDashboards,
      id: PLUGIN_ID,
      title: PLUGIN_NAME,
      euiIconType: PLUGIN_ICON,
      order: -2000,
      updater$: appUpdater$,
      appRoute: PLUGIN_PATH,
      async mount(params: AppMountParameters) {
        // Load application bundle
        const { renderApp } = await import('./application');
        // Get start services as specified in opensearch_dashboards.json
        const [coreStart, depsStart] = await core.getStartServices();

        // Render the application
        return renderApp(coreStart, depsStart as AppPluginStartDependencies, params);
      },
      workspaceAvailability: WorkspaceAvailability.outsideWorkspace,
    });

    if (home) {
      home.featureCatalogue.registerSolution({
        id: 'opensearchDashboards',
        title: i18n.translate('opensearchDashboardsOverview.opensearchDashboards.solution.title', {
          defaultMessage: 'OpenSearch Dashboards',
        }),
        subtitle: i18n.translate(
          'opensearchDashboardsOverview.opensearchDashboards.solution.subtitle',
          {
            defaultMessage: 'Visualize & analyze',
          }
        ),
        appDescriptions: [
          i18n.translate('opensearchDashboardsOverview.opensearchDashboards.appDescription1', {
            defaultMessage: 'Analyze data in dashboards.',
          }),
          i18n.translate('opensearchDashboardsOverview.opensearchDashboards.appDescription2', {
            defaultMessage: 'Search and find insights.',
          }),
          i18n.translate('opensearchDashboardsOverview.opensearchDashboards.appDescription3', {
            defaultMessage: 'Design pixel-perfect presentations.',
          }),
          i18n.translate('opensearchDashboardsOverview.opensearchDashboards.appDescription4', {
            defaultMessage: 'Plot geographic data.',
          }),
          i18n.translate('opensearchDashboardsOverview.opensearchDashboards.appDescription5', {
            defaultMessage: 'Model, predict, and detect.',
          }),
          i18n.translate('opensearchDashboardsOverview.opensearchDashboards.appDescription6', {
            defaultMessage: 'Reveal patterns and relationships.',
          }),
        ],
        icon: 'inputOutput',
        path: PLUGIN_PATH,
        order: 400,
      });
    }

    // Return methods that should be available to other plugins
    return {};
  }

  public start(core: CoreStart): OpenSearchDashboardsOverviewPluginStart {
    return {};
  }

  public stop() {}
}
