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
  ChromeBreadcrumb,
  ScopedHistory,
} from 'src/core/public';
import { DataPublicPluginStart } from 'src/plugins/data/public';
import { DataSourcePluginStart } from 'src/plugins/data_source/public';
import { UrlForwardingSetup } from '../../url_forwarding/public';
import {
  IndexPatternManagementService,
  IndexPatternManagementServiceSetup,
  IndexPatternManagementServiceStart,
} from './service';

import { ManagementAppMountParams, ManagementSetup } from '../../management/public';
import { DEFAULT_APP_CATEGORIES } from '../../../core/public';
import { reactRouterNavigate } from '../../opensearch_dashboards_react/public';

export interface IndexPatternManagementSetupDependencies {
  management: ManagementSetup;
  urlForwarding: UrlForwardingSetup;
}

export interface IndexPatternManagementStartDependencies {
  data: DataPublicPluginStart;
  dataSource?: DataSourcePluginStart;
}

export interface IndexPatternManagementSetup extends IndexPatternManagementServiceSetup {
  registerLibrarySubApp: () => void;
}

export type IndexPatternManagementStart = IndexPatternManagementServiceStart;

const sectionsHeader = i18n.translate('indexPatternManagement.indexPattern.sectionsHeader', {
  defaultMessage: 'Index patterns',
});

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
    { management, urlForwarding }: IndexPatternManagementSetupDependencies
  ) {
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
        const { mountManagementSection } = await import('./management_app');

        return mountManagementSection(core.getStartServices, params, () =>
          this.indexPatternManagementService.environmentService.getEnvironment().ml()
        );
      },
    });

    const registerLibrarySubApp = () => {
      // disable it under Dashboards Management
      opensearchDashboardsSection.getApp(IPM_APP_ID)?.disable();
      // register it under Library
      core.application.register({
        id: IPM_APP_ID,
        title: sectionsHeader,
        order: 8100,
        category: DEFAULT_APP_CATEGORIES.opensearchDashboards,
        mount: async (params: AppMountParameters) => {
          const { mountManagementSection } = await import('./management_app');

          const [coreStart] = await core.getStartServices();

          const setBreadcrumbsScope = (
            crumbs: ChromeBreadcrumb[] = [],
            appHistory?: ScopedHistory
          ) => {
            const wrapBreadcrumb = (item: ChromeBreadcrumb, scopedHistory: ScopedHistory) => ({
              ...item,
              ...(item.href ? reactRouterNavigate(scopedHistory, item.href) : {}),
            });

            coreStart.chrome.setBreadcrumbs([
              ...crumbs.map((item) => wrapBreadcrumb(item, appHistory || params.history)),
            ]);
          };

          const managementParams: ManagementAppMountParams = {
            element: params.element,
            history: params.history,
            setBreadcrumbs: setBreadcrumbsScope,
            basePath: params.appBasePath,
          };

          return mountManagementSection(
            core.getStartServices,
            managementParams,
            () => this.indexPatternManagementService.environmentService.getEnvironment().ml(),
            true
          );
        },
      });
    };

    return {
      ...this.indexPatternManagementService.setup({ httpClient: core.http }),
      registerLibrarySubApp,
    };
  }

  public start(core: CoreStart, plugins: IndexPatternManagementStartDependencies) {
    return this.indexPatternManagementService.start();
  }

  public stop() {
    this.indexPatternManagementService.stop();
  }
}
