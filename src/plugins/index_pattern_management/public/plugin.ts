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
import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  AppMountParameters,
} from 'src/core/public';
import { DataPublicPluginStart } from 'src/plugins/data/public';
import { DataSourcePluginSetup, DataSourcePluginStart } from 'src/plugins/data_source/public';
import { UrlForwardingSetup } from '../../url_forwarding/public';
import {
  IndexPatternManagementService,
  IndexPatternManagementServiceSetup,
  IndexPatternManagementServiceStart,
} from './service';

import { ManagementSetup } from '../../management/public';
import { AppStatus, DEFAULT_NAV_GROUPS } from '../../../core/public';
import { getScopedBreadcrumbs } from '../../opensearch_dashboards_react/public';
import { NavigationPublicPluginStart } from '../../navigation/public';

export interface IndexPatternManagementSetupDependencies {
  management: ManagementSetup;
  urlForwarding: UrlForwardingSetup;
  dataSource?: DataSourcePluginSetup;
}

export interface IndexPatternManagementStartDependencies {
  data: DataPublicPluginStart;
  navigation: NavigationPublicPluginStart;
  dataSource?: DataSourcePluginStart;
}

export type IndexPatternManagementSetup = IndexPatternManagementServiceSetup;

export type IndexPatternManagementStart = IndexPatternManagementServiceStart;

const sectionsHeader = i18n.translate('indexPatternManagement.indexPattern.sectionsHeader', {
  defaultMessage: 'Index patterns',
});

/**
 * The id is used in src/plugins/workspace/public/plugin.ts and please change that accordingly if you change the id here.
 */
const IPM_APP_ID = 'indexPatterns';

export class IndexPatternManagementPlugin
  implements
    Plugin<
      IndexPatternManagementSetup,
      IndexPatternManagementStart,
      IndexPatternManagementSetupDependencies,
      IndexPatternManagementStartDependencies
    > {
  private readonly indexPatternManagementService = new IndexPatternManagementService();

  constructor(initializerContext: PluginInitializerContext) {}

  public setup(
    core: CoreSetup<IndexPatternManagementStartDependencies, IndexPatternManagementStart>,
    dependencies: IndexPatternManagementSetupDependencies
  ) {
    const { urlForwarding, management, dataSource } = dependencies;

    const opensearchDashboardsSection = management.sections.section.opensearchDashboards;

    if (!opensearchDashboardsSection) {
      throw new Error('`opensearchDashboards` management section not found.');
    }

    const newAppPath = `management/opensearch-dashboards/${IPM_APP_ID}`;
    const legacyPatternsPath = 'management/opensearch-dashboards/index_patterns';

    urlForwarding.forwardApp(
      'management/opensearch-dashboards/index_pattern',
      newAppPath,
      (path) => '/create'
    );
    urlForwarding.forwardApp(legacyPatternsPath, newAppPath, (path) => {
      const pathInApp = path.substr(legacyPatternsPath.length + 1);
      return pathInApp && `/patterns${pathInApp}`;
    });

    opensearchDashboardsSection.registerApp({
      id: IPM_APP_ID,
      title: sectionsHeader,
      order: 0,
      mount: async (params) => {
        if (core.chrome.navGroup.getNavGroupEnabled()) {
          const [coreStart] = await core.getStartServices();
          const urlForStandardIPMApp = new URL(
            coreStart.application.getUrlForApp(IPM_APP_ID),
            window.location.href
          );
          const targetUrl = new URL(window.location.href);
          targetUrl.pathname = urlForStandardIPMApp.pathname;
          coreStart.application.navigateToUrl(targetUrl.toString());
          return () => {};
        }
        const { mountManagementSection } = await import('./management_app');

        return mountManagementSection(
          core.getStartServices,
          params,
          () => this.indexPatternManagementService.environmentService.getEnvironment().ml(),
          dataSource
        );
      },
    });

    core.application.register({
      id: IPM_APP_ID,
      title: sectionsHeader,
      description: i18n.translate('indexPatternManagement.indexPattern.description', {
        defaultMessage: 'Manage index patterns to retrieve data from OpenSearch.',
      }),
      status: core.chrome.navGroup.getNavGroupEnabled()
        ? AppStatus.accessible
        : AppStatus.inaccessible,
      mount: async (params: AppMountParameters) => {
        const { mountManagementSection } = await import('./management_app');
        const [coreStart] = await core.getStartServices();

        return mountManagementSection(
          core.getStartServices,
          {
            ...params,
            basePath: core.http.basePath.get(),
            setBreadcrumbs: (breadCrumbs) =>
              coreStart.chrome.setBreadcrumbs(getScopedBreadcrumbs(breadCrumbs, params.history)),
            wrapInPage: true,
          },
          () => this.indexPatternManagementService.environmentService.getEnvironment().ml(),
          dataSource
        );
      },
    });

    core.getStartServices().then(([coreStart]) => {
      /**
       * The `capabilities.workspaces.enabled` indicates
       * if workspace feature flag is turned on or not and
       * the global index pattern management page should only be registered
       * to settings and setup when workspace is turned off,
       */
      if (!coreStart.application.capabilities.workspaces.enabled) {
        core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.settingsAndSetup, [
          {
            id: IPM_APP_ID,
            title: sectionsHeader,
            order: 400,
          },
        ]);
      }
    });

    return this.indexPatternManagementService.setup({ httpClient: core.http });
  }

  public start(core: CoreStart, plugins: IndexPatternManagementStartDependencies) {
    return this.indexPatternManagementService.start();
  }

  public stop() {
    this.indexPatternManagementService.stop();
  }
}
