/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
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

/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { BehaviorSubject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import {
  CoreSetup,
  CoreStart,
  Plugin,
  PluginInitializerContext,
  DEFAULT_APP_CATEGORIES,
  AppMountParameters,
  AppUpdater,
  ScopedHistory,
  AppNavLinkStatus,
} from '../../../core/public';
import { Panel } from './panels/panel';
import {
  initAngularBootstrap,
  OpenSearchDashboardsLegacyStart,
} from '../../opensearch_dashboards_legacy/public';
import { createOsdUrlTracker } from '../../opensearch_dashboards_utils/public';
import { DataPublicPluginStart, opensearchFilters, DataPublicPluginSetup } from '../../data/public';
import { NavigationPublicPluginStart } from '../../navigation/public';
import { VisualizationsStart } from '../../visualizations/public';
import {
  VisTypeTimelinePluginStart,
  VisTypeTimelinePluginSetup,
} from '../../vis_type_timeline/public';

export interface TimelinePluginDependencies {
  data: DataPublicPluginStart;
  navigation: NavigationPublicPluginStart;
  visualizations: VisualizationsStart;
  visTypeTimeline: VisTypeTimelinePluginStart;
}

/** @internal */
export class TimelinePlugin implements Plugin<void, void> {
  initializerContext: PluginInitializerContext;
  private appStateUpdater = new BehaviorSubject<AppUpdater>(() => ({}));
  private stopUrlTracking: (() => void) | undefined = undefined;
  private currentHistory: ScopedHistory | undefined = undefined;

  constructor(initializerContext: PluginInitializerContext) {
    this.initializerContext = initializerContext;
  }

  public setup(
    core: CoreSetup,
    {
      data,
      visTypeTimeline,
    }: { data: DataPublicPluginSetup; visTypeTimeline: VisTypeTimelinePluginSetup }
  ) {
    const timelinePanels: Map<string, Panel> = new Map();

    const { appMounted, appUnMounted, stop: stopUrlTracker } = createOsdUrlTracker({
      baseUrl: core.http.basePath.prepend('/app/timeline'),
      defaultSubUrl: '#/',
      storageKey: `lastUrl:${core.http.basePath.get()}:timeline`,
      navLinkUpdater$: this.appStateUpdater,
      toastNotifications: core.notifications.toasts,
      stateParams: [
        {
          osdUrlKey: '_g',
          stateUpdate$: data.query.state$.pipe(
            filter(
              ({ changes }) => !!(changes.globalFilters || changes.time || changes.refreshInterval)
            ),
            map(({ state }) => ({
              ...state,
              filters: state.filters?.filter(opensearchFilters.isFilterPinned),
            }))
          ),
        },
      ],
      getHistory: () => this.currentHistory!,
    });

    this.stopUrlTracking = () => {
      stopUrlTracker();
    };

    initAngularBootstrap();
    core.application.register({
      id: 'timelion',
      title: 'Timeline',
      order: 8000,
      defaultPath: '#/',
      euiIconType: 'inputOutput',
      category: DEFAULT_APP_CATEGORIES.opensearchDashboards,
      navLinkStatus:
        visTypeTimeline.isUiEnabled === false ? AppNavLinkStatus.hidden : AppNavLinkStatus.default,
      mount: async (params: AppMountParameters) => {
        const [coreStart, pluginsStart] = await core.getStartServices();
        this.currentHistory = params.history;

        appMounted();

        const unlistenParentHistory = params.history.listen(() => {
          window.dispatchEvent(new HashChangeEvent('hashchange'));
        });

        const { renderApp } = await import('./application');
        params.element.classList.add('timelineAppContainer');
        const unmount = renderApp({
          mountParams: params,
          pluginInitializerContext: this.initializerContext,
          timelinePanels,
          core: coreStart,
          plugins: pluginsStart as TimelinePluginDependencies,
        });
        return () => {
          unlistenParentHistory();
          unmount();
          appUnMounted();
        };
      },
    });
  }

  public start(
    core: CoreStart,
    { opensearchDashboardsLegacy }: { opensearchDashboardsLegacy: OpenSearchDashboardsLegacyStart }
  ) {
    opensearchDashboardsLegacy.loadFontAwesome();
  }

  public stop(): void {
    if (this.stopUrlTracking) {
      this.stopUrlTracking();
    }
  }
}
