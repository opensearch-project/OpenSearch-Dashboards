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
  AppMountParameters,
  AppUpdater,
  CoreSetup,
  CoreStart,
  Plugin,
} from 'opensearch-dashboards/public';
import { BehaviorSubject } from 'rxjs';
import { FeatureCatalogueCategory } from '../../home/public';
import { ComponentRegistry } from './component_registry';
import {
  AdvancedSettingsSetup,
  AdvancedSettingsStart,
  AdvancedSettingsPluginSetup,
  AdvancedSettingsPluginStart,
} from './types';
import {
  DEFAULT_NAV_GROUPS,
  AppStatus,
  AppNavLinkStatus,
  WorkspaceAvailability,
} from '../../../core/public';
import { getScopedBreadcrumbs } from '../../opensearch_dashboards_react/public';
import { setupUserSettingsPage } from './management_app/user_settings';

const component = new ComponentRegistry();

const title = i18n.translate('advancedSettings.advancedSettingsLabel', {
  defaultMessage: 'Advanced settings',
});

const titleInGroup = i18n.translate('advancedSettings.applicationSettingsLabel', {
  defaultMessage: 'Application settings',
});

const USER_SETTINGS_APPID = 'user_settings';
export class AdvancedSettingsPlugin
  implements
    Plugin<
      AdvancedSettingsSetup,
      AdvancedSettingsStart,
      AdvancedSettingsPluginSetup,
      AdvancedSettingsPluginStart
    > {
  private appUpdater$ = new BehaviorSubject<AppUpdater>(() => undefined);

  public setup(
    core: CoreSetup<AdvancedSettingsPluginStart>,
    { management, home, contentManagement: contentManagementSetup }: AdvancedSettingsPluginSetup
  ) {
    const opensearchDashboardsSection = management.sections.section.opensearchDashboards;

    opensearchDashboardsSection.registerApp({
      id: 'settings',
      title,
      order: 3,
      async mount(params) {
        const { mountManagementSection } = await import(
          './management_app/mount_management_section'
        );
        return mountManagementSection(core.getStartServices, params, component.start);
      },
    });

    core.application.register({
      id: 'settings',
      title,
      navLinkStatus: core.chrome.navGroup.getNavGroupEnabled()
        ? AppNavLinkStatus.visible
        : AppNavLinkStatus.hidden,
      workspaceAvailability: WorkspaceAvailability.outsideWorkspace,
      description: i18n.translate('advancedSettings.description', {
        defaultMessage: 'Customize the appearance and behavior of OpenSearch Dashboards.',
      }),
      mount: async (params: AppMountParameters) => {
        const { mountManagementSection } = await import(
          './management_app/mount_management_section'
        );
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
          component.start
        );
      },
    });

    core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.settingsAndSetup, [
      {
        id: 'settings',
        title: titleInGroup,
        order: 100,
      },
    ]);

    if (core.chrome.navGroup.getNavGroupEnabled()) {
      setupUserSettingsPage(contentManagementSetup);

      const userSettingTitle = i18n.translate('advancedSettings.userSettingsLabel', {
        defaultMessage: 'User settings',
      });

      core.application.register({
        id: USER_SETTINGS_APPID,
        title: userSettingTitle,
        updater$: this.appUpdater$,
        navLinkStatus: core.chrome.navGroup.getNavGroupEnabled()
          ? AppNavLinkStatus.visible
          : AppNavLinkStatus.hidden,
        workspaceAvailability: WorkspaceAvailability.outsideWorkspace,
        description: i18n.translate('advancedSettings.userSettings.description', {
          defaultMessage: 'Configure your personal preferences.',
        }),
        mount: async (params: AppMountParameters) => {
          const { renderUserSettingsApp } = await import(
            './management_app/mount_management_section'
          );
          const [coreStart, { contentManagement, navigation }] = await core.getStartServices();

          return renderUserSettingsApp(params, { ...coreStart, contentManagement, navigation });
        },
      });

      core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.settingsAndSetup, [
        {
          id: USER_SETTINGS_APPID,
          order: 101, // just right after application settings which order is 100
        },
      ]);
    }

    if (home) {
      home.featureCatalogue.register({
        id: 'advanced_settings',
        title,
        description: i18n.translate('advancedSettings.featureCatalogueTitle', {
          defaultMessage:
            'Customize your OpenSearch Dashboards experience — change the date format, turn on dark mode, and more.',
        }),
        icon: 'gear',
        path: '/app/management/opensearch-dashboards/settings',
        showOnHomePage: false,
        category: FeatureCatalogueCategory.ADMIN,
      });
    }

    return {
      component: component.setup,
    };
  }

  public start(core: CoreStart) {
    this.appUpdater$.next((app) => {
      const userSettingsEnabled = core.application.capabilities.userSettings?.enabled;
      if (app.id === USER_SETTINGS_APPID) {
        return {
          status: userSettingsEnabled ? AppStatus.accessible : AppStatus.inaccessible,
          navLinkStatus: userSettingsEnabled ? AppNavLinkStatus.visible : AppNavLinkStatus.hidden,
        };
      }
    });

    return {
      component: component.start,
    };
  }
}
