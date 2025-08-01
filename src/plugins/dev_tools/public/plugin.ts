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

import React from 'react';
import { BehaviorSubject } from 'rxjs';
import { Plugin, CoreSetup, AppMountParameters, CoreStart } from 'src/core/public';
import { AppUpdater } from 'opensearch-dashboards/public';
import { i18n } from '@osd/i18n';
import { sortBy } from 'lodash';
import { DataSourceManagementPluginSetup } from 'src/plugins/data_source_management/public';
import { DataSourcePluginSetup } from 'src/plugins/data_source/public';
import {
  AppNavLinkStatus,
  DEFAULT_APP_CATEGORIES,
  RightNavigationOrder,
  RightNavigationButton,
} from '../../../core/public';
import { UrlForwardingSetup } from '../../url_forwarding/public';
import { CreateDevToolArgs, DevToolApp, createDevToolApp } from './dev_tool';

import './index.scss';
import { ManagementOverViewPluginSetup } from '../../management_overview/public';
import { toMountPoint } from '../../opensearch_dashboards_react/public';
import { DevToolsIcon } from './dev_tools_icon';
import { WorkspaceAvailability } from '../../../core/public';
import { searchForDevTools } from './global_search/search_devtool_command';
import { Trigger, UiActionsSetup, UiActionsStart } from '../../ui_actions/public';

export const DEVTOOL_OPEN_ACTION = 'DEVTOOL_OPEN_ACTION';
export const DEVTOOL_TRIGGER_ID = 'DEVTOOL_TRIGGER_ID';
export const devToolsTrigger: Trigger = {
  id: DEVTOOL_TRIGGER_ID,
};

export interface DevToolsContext {
  defaultRoute: string;
}

declare module '../../ui_actions/public' {
  export interface TriggerContextMapping {
    [DEVTOOL_TRIGGER_ID]: {};
  }

  export interface ActionContextMapping {
    [DEVTOOL_OPEN_ACTION]: DevToolsContext;
  }
}

export interface DevToolsSetupDependencies {
  urlForwarding: UrlForwardingSetup;
  uiActions: UiActionsSetup;
  dataSource?: DataSourcePluginSetup;
  dataSourceManagement?: DataSourceManagementPluginSetup;
  managementOverview?: ManagementOverViewPluginSetup;
}

export interface DevToolsStartDependencies {
  uiActions: UiActionsStart;
}
export interface DevToolsSetup {
  /**
   * Register a developer tool. It will be available
   * in the dev tools app under a separate tab.
   *
   * Registering dev tools works almost similar to registering
   * applications in the core application service,
   * but they will be rendered with a frame containing tabs
   * to switch between the tools.
   * @param devTool The dev tools descriptor
   */
  register: (devTool: CreateDevToolArgs) => DevToolApp;
}

export class DevToolsPlugin implements Plugin<DevToolsSetup> {
  private readonly devTools = new Map<string, DevToolApp>();
  private appStateUpdater = new BehaviorSubject<AppUpdater>(() => ({}));
  private setupDeps: DevToolsSetupDependencies | undefined;
  private uiActionsStart: UiActionsStart | undefined;

  private getSortedDevTools(): readonly DevToolApp[] {
    return sortBy([...this.devTools.values()], 'order');
  }

  private getUiActionsStart(): UiActionsStart {
    return this.uiActionsStart!;
  }

  private title = i18n.translate('devTools.devToolsTitle', {
    defaultMessage: 'Dev Tools',
  });

  private id = 'dev_tools';

  public setup(coreSetup: CoreSetup, deps: DevToolsSetupDependencies) {
    const { application: applicationSetup, getStartServices } = coreSetup;
    const { urlForwarding, managementOverview, uiActions } = deps;
    this.setupDeps = deps;

    applicationSetup.register({
      id: this.id,
      title: this.title,
      updater$: this.appStateUpdater,
      icon: '/ui/logos/opensearch_mark.svg',
      /* the order of dev tools, it shows as last item of management section */
      order: 9070,
      category: DEFAULT_APP_CATEGORIES.management,
      workspaceAvailability: WorkspaceAvailability.outsideWorkspace,
      mount: async (params: AppMountParameters) => {
        const { element, history } = params;
        element.classList.add('devAppWrapper');

        const [core] = await getStartServices();

        const { renderApp } = await import('./application');
        return renderApp(core, element, history, this.getSortedDevTools(), deps);
      },
    });

    managementOverview?.register({
      id: this.id,
      title: this.title,
      description: i18n.translate('devTools.devToolsDescription', {
        defaultMessage:
          'Use the console to set up and troubleshoot your OpenSearch environment with the REST API.',
      }),
      order: 9070,
    });

    urlForwarding.forwardApp('dev_tools', 'dev_tools');

    if (coreSetup.chrome.navGroup.getNavGroupEnabled()) {
      /**
       * register search strategy for dev tools
       */
      coreSetup.chrome.globalSearch.registerSearchCommand({
        id: 'devtools',
        type: 'PAGES',
        run: async (query: string, callback?: () => void) =>
          searchForDevTools(query, {
            devTools: this.getSortedDevTools.bind(this),
            title: this.title,
            uiActionsApi: this.getUiActionsStart.bind(this),
            callback,
          }),
      });

      uiActions.registerTrigger(devToolsTrigger);
    }

    return {
      register: (devToolArgs: CreateDevToolArgs) => {
        if (this.devTools.has(devToolArgs.id)) {
          throw new Error(
            `Dev tool with id [${devToolArgs.id}] has already been registered. Use a unique id.`
          );
        }

        const devTool = createDevToolApp(devToolArgs);
        this.devTools.set(devTool.id, devTool);
        return devTool;
      },
    };
  }

  public start(core: CoreStart, { uiActions }: DevToolsStartDependencies) {
    this.uiActionsStart = uiActions;
    if (core.chrome.navGroup.getNavGroupEnabled()) {
      core.chrome.navControls.registerLeftBottom({
        order: 4,
        mount: toMountPoint(
          React.createElement(DevToolsIcon, {
            core,
            appId: this.id,
            devTools: this.getSortedDevTools(),
            deps: this.setupDeps as DevToolsSetupDependencies,
            title: this.title,
          })
        ),
      });
    }
    if (this.getSortedDevTools().length === 0 || core.chrome.navGroup.getNavGroupEnabled()) {
      this.appStateUpdater.next(() => ({ navLinkStatus: AppNavLinkStatus.hidden }));
    } else {
      // Register right navigation for dev tool only when console and futureNavigation are both enabled.
      const topRightNavigationEnabled = core.application.capabilities?.dev_tools?.futureNavigation;
      if (topRightNavigationEnabled) {
        core.chrome.navControls.registerRight({
          order: RightNavigationOrder.DevTool,
          mount: toMountPoint(
            React.createElement(RightNavigationButton, {
              appId: this.id,
              iconType: 'consoleApp',
              title: this.title,
              application: core.application,
              http: core.http,
            })
          ),
        });
      }
    }
  }

  public stop() {}
}
