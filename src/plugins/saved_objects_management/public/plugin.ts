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
import { i18n } from '@osd/i18n';
import { AppMountParameters, CoreSetup, CoreStart, Plugin } from 'src/core/public';

import { DataSourcePluginSetup } from 'src/plugins/data_source/public';
import { ContentManagementPluginStart } from 'src/plugins/content_management/public';
import { DataSourceManagementPluginSetup } from 'src/plugins/data_source_management/public';
import { VisBuilderStart } from '../../vis_builder/public';
import { ManagementSetup } from '../../management/public';
import { UiActionsSetup, UiActionsStart } from '../../ui_actions/public';
import { DataPublicPluginStart } from '../../data/public';
import { DashboardStart } from '../../dashboard/public';
import { DiscoverStart } from '../../discover/public';
import {
  HomePublicPluginSetup,
  HomePublicPluginStart,
  FeatureCatalogueCategory,
} from '../../home/public';
import { VisualizationsStart } from '../../visualizations/public';
import { VisAugmenterStart } from '../../vis_augmenter/public';
import {
  SavedObjectsManagementActionService,
  SavedObjectsManagementActionServiceSetup,
  SavedObjectsManagementActionServiceStart,
  SavedObjectsManagementColumnService,
  SavedObjectsManagementColumnServiceSetup,
  SavedObjectsManagementColumnServiceStart,
  SavedObjectsManagementNamespaceService,
  SavedObjectsManagementNamespaceServiceSetup,
  SavedObjectsManagementNamespaceServiceStart,
  SavedObjectsManagementServiceRegistry,
  ISavedObjectsManagementServiceRegistry,
} from './services';
import { registerServices } from './register_services';
import { bootstrap } from './ui_actions_bootstrap';
import { DEFAULT_NAV_GROUPS } from '../../../core/public';
import { RecentWork } from './management_section/recent_work';
import {
  HOME_CONTENT_AREAS,
  ESSENTIAL_OVERVIEW_CONTENT_AREAS,
  ANALYTICS_ALL_OVERVIEW_CONTENT_AREAS,
} from '../../../plugins/content_management/public';
import { getScopedBreadcrumbs } from '../../opensearch_dashboards_react/public';
import { NavigationPublicPluginStart } from '../../../plugins/navigation/public';

/**
 * The id is used in src/plugins/workspace/public/plugin.ts and please change that accordingly if you change the id here.
 */
export const APP_ID = 'objects';

export interface SavedObjectsManagementPluginSetup {
  actions: SavedObjectsManagementActionServiceSetup;
  columns: SavedObjectsManagementColumnServiceSetup;
  namespaces: SavedObjectsManagementNamespaceServiceSetup;
  serviceRegistry: ISavedObjectsManagementServiceRegistry;
}

export interface SavedObjectsManagementPluginStart {
  actions: SavedObjectsManagementActionServiceStart;
  columns: SavedObjectsManagementColumnServiceStart;
  namespaces: SavedObjectsManagementNamespaceServiceStart;
}

export interface SetupDependencies {
  management: ManagementSetup;
  home?: HomePublicPluginSetup;
  uiActions: UiActionsSetup;
  dataSource?: DataSourcePluginSetup;
  dataSourceManagement?: DataSourceManagementPluginSetup;
}

export interface StartDependencies {
  home?: HomePublicPluginStart;
  data: DataPublicPluginStart;
  dashboard?: DashboardStart;
  visualizations?: VisualizationsStart;
  visAugmenter?: VisAugmenterStart;
  discover?: DiscoverStart;
  visBuilder?: VisBuilderStart;
  uiActions: UiActionsStart;
  contentManagement?: ContentManagementPluginStart;
  navigation: NavigationPublicPluginStart;
}

export class SavedObjectsManagementPlugin
  implements
    Plugin<
      SavedObjectsManagementPluginSetup,
      SavedObjectsManagementPluginStart,
      SetupDependencies,
      StartDependencies
    > {
  private actionService = new SavedObjectsManagementActionService();
  private columnService = new SavedObjectsManagementColumnService();
  private namespaceService = new SavedObjectsManagementNamespaceService();
  private serviceRegistry = new SavedObjectsManagementServiceRegistry();

  public setup(
    core: CoreSetup<StartDependencies, SavedObjectsManagementPluginStart>,
    { home, management, uiActions, dataSource, dataSourceManagement }: SetupDependencies
  ): SavedObjectsManagementPluginSetup {
    const actionSetup = this.actionService.setup();
    const columnSetup = this.columnService.setup();
    const namespaceSetup = this.namespaceService.setup();

    if (home) {
      home.featureCatalogue.register({
        id: 'saved_objects',
        title: i18n.translate('savedObjectsManagement.objects.savedObjectsTitle', {
          defaultMessage: 'Saved Objects',
        }),
        description: i18n.translate('savedObjectsManagement.objects.savedObjectsDescription', {
          defaultMessage:
            'Import, export, and manage your saved searches, visualizations, and dashboards.',
        }),
        icon: 'savedObjectsApp',
        path: '/app/management/opensearch-dashboards/objects',
        showOnHomePage: false,
        category: FeatureCatalogueCategory.ADMIN,
      });
    }

    const opensearchDashboardsSection = management.sections.section.opensearchDashboards;
    opensearchDashboardsSection.registerApp({
      id: APP_ID,
      title: i18n.translate('savedObjectsManagement.managementSectionLabel', {
        defaultMessage: 'Saved objects',
      }),
      order: 1,
      mount: async (mountParams) => {
        const { mountManagementSection } = await import('./management_section');
        return mountManagementSection({
          core,
          serviceRegistry: this.serviceRegistry,
          mountParams,
          dataSourceEnabled: !!dataSource,
          dataSourceManagement,
        });
      },
    });

    if (core.chrome.navGroup.getNavGroupEnabled()) {
      core.application.register({
        id: APP_ID,
        title: i18n.translate('savedObjectsManagement.assets.label', {
          defaultMessage: 'Assets',
        }),
        description: i18n.translate('savedObjectsManagement.assets.description', {
          defaultMessage: 'Manage and share your global assets.',
        }),
        mount: async (params: AppMountParameters) => {
          const { mountManagementSection } = await import('./management_section');
          const [coreStart] = await core.getStartServices();

          return mountManagementSection({
            core,
            serviceRegistry: this.serviceRegistry,
            mountParams: {
              ...params,
              basePath: core.http.basePath.get(),
              setBreadcrumbs: (breadCrumbs) =>
                coreStart.chrome.setBreadcrumbs(getScopedBreadcrumbs(breadCrumbs, params.history)),
              wrapInPage: true,
            },
            dataSourceEnabled: !!dataSource,
            dataSourceManagement,
          });
        },
      });
    }

    core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.settingsAndSetup, [
      {
        id: APP_ID,
        order: 400,
      },
    ]);

    // sets up the context mappings and registers any triggers/actions for the plugin
    bootstrap(uiActions);

    // depends on `getStartServices`, should not be awaited
    registerServices(this.serviceRegistry, core.getStartServices);

    return {
      actions: actionSetup,
      columns: columnSetup,
      namespaces: namespaceSetup,
      serviceRegistry: this.serviceRegistry,
    };
  }

  public start(core: CoreStart, { data, uiActions, contentManagement }: StartDependencies) {
    const actionStart = this.actionService.start();
    const columnStart = this.columnService.start();
    const namespaceStart = this.namespaceService.start();
    const workspaceEnabled = core.application.capabilities.workspaces.enabled;

    contentManagement?.registerContentProvider({
      id: 'recent',
      getContent: () => {
        return {
          order: 1,
          id: 'recent',
          kind: 'custom',
          render: () =>
            React.createElement(RecentWork, {
              core,
              workspaceEnabled,
            }),
        };
      },
      getTargetArea: () => [
        HOME_CONTENT_AREAS.RECENTLY_VIEWED,
        ESSENTIAL_OVERVIEW_CONTENT_AREAS.RECENTLY_VIEWED,
        ANALYTICS_ALL_OVERVIEW_CONTENT_AREAS.RECENTLY_VIEWED,
      ],
    });

    return {
      actions: actionStart,
      columns: columnStart,
      namespaces: namespaceStart,
    };
  }
}
