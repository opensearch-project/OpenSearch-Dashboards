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
import { BehaviorSubject } from 'rxjs';
import { first } from 'rxjs/operators';
import { ManagementSetup, ManagementStart } from './types';
import { HomePublicPluginSetup } from '../../home/public';
import {
  CoreSetup,
  CoreStart,
  Plugin,
  DEFAULT_APP_CATEGORIES,
  PluginInitializerContext,
  AppMountParameters,
  AppUpdater,
  AppStatus,
  AppNavLinkStatus,
  DEFAULT_NAV_GROUPS,
  WorkspaceAvailability,
  ChromeNavLink,
} from '../../../core/public';

import { MANAGEMENT_APP_ID } from '../common/contants';
import {
  ManagementSectionsService,
  getSectionsServiceStartPrivate,
} from './management_sections_service';
import { ManagementOverViewPluginSetup } from '../../management_overview/public';
import { toMountPoint } from '../../opensearch_dashboards_react/public';
import { SettingsIcon } from './components/settings_icon';
import {
  fulfillRegistrationLinksToChromeNavLinks,
  LinkItemType,
  getSortedNavLinks,
} from '../../../core/public';

interface ManagementSetupDependencies {
  home?: HomePublicPluginSetup;
  managementOverview?: ManagementOverViewPluginSetup;
}

export class ManagementPlugin implements Plugin<ManagementSetup, ManagementStart> {
  private readonly managementSections = new ManagementSectionsService();

  private readonly appUpdater = new BehaviorSubject<AppUpdater>(() => ({}));

  private hasAnyEnabledApps = true;

  constructor(private initializerContext: PluginInitializerContext) {}

  private title = i18n.translate('management.dashboardManagement.title', {
    defaultMessage: 'Dashboards Management',
  });

  public setup(core: CoreSetup, { home, managementOverview }: ManagementSetupDependencies) {
    const opensearchDashboardsVersion = this.initializerContext.env.packageInfo.version;

    core.application.register({
      id: MANAGEMENT_APP_ID,
      title: this.title,
      order: 9030,
      icon: '/ui/logos/opensearch_mark.svg',
      category: DEFAULT_APP_CATEGORIES.management,
      updater$: this.appUpdater,
      navLinkStatus: core.chrome.navGroup.getNavGroupEnabled()
        ? AppNavLinkStatus.hidden
        : AppNavLinkStatus.default,
      async mount(params: AppMountParameters) {
        const { renderApp } = await import('./application');
        const [coreStart] = await core.getStartServices();
        const hideInAppNavigation = core.chrome.navGroup.getNavGroupEnabled();

        return renderApp(params, {
          sections: getSectionsServiceStartPrivate(),
          opensearchDashboardsVersion,
          setBreadcrumbs: coreStart.chrome.setBreadcrumbs,
          hideInAppNavigation,
        });
      },
    });

    const settingsLandingPageId = 'settings_landing';

    const settingsLandingPageTitle = i18n.translate('management.settings.landingPage.title', {
      defaultMessage: 'Settings and setup',
    });

    const dataAdministrationLandingPageId = 'data_administration_landing';

    const dataAdministrationPageTitle = i18n.translate(
      'management.dataAdministration.landingPage.title',
      {
        defaultMessage: 'Data administration',
      }
    );

    const getNavLinksByNavGroupId = async (navGroupId: string) => {
      const [coreStart] = await core.getStartServices();
      const navGroupMap = await coreStart.chrome.navGroup
        .getNavGroupsMap$()
        .pipe(first())
        .toPromise();
      const navLinks = navGroupMap[navGroupId]?.navLinks;
      return getSortedNavLinks(
        fulfillRegistrationLinksToChromeNavLinks(
          navLinks || [],
          coreStart.chrome.navLinks.getAll()
        ),
        (currentItem, parentItem) => {
          if (
            currentItem.itemType === LinkItemType.LINK &&
            parentItem?.itemType === LinkItemType.PARENT_LINK
          ) {
            return {
              ...currentItem,
              link: {
                ...currentItem.link,
                hidden: true,
              },
            };
          }

          if (currentItem.itemType === LinkItemType.PARENT_LINK) {
            let payload = currentItem.link;
            if (payload) {
              if (currentItem.links?.[0].itemType === LinkItemType.LINK) {
                payload = {
                  ...payload,
                  ...currentItem.links?.[0].link,
                  title: payload.title,
                };
              }
            }

            return {
              ...currentItem,
              link: payload,
            };
          }

          return currentItem;
        }
      ).filter((navLink) => !navLink.hidden);
    };

    core.application.register({
      id: settingsLandingPageId,
      title: settingsLandingPageTitle,
      order: 100,
      navLinkStatus: core.chrome.navGroup.getNavGroupEnabled()
        ? AppNavLinkStatus.visible
        : AppNavLinkStatus.hidden,
      workspaceAvailability: WorkspaceAvailability.outsideWorkspace,
      mount: async (params: AppMountParameters) => {
        const { renderApp } = await import('./landing_page_application');
        const [coreStart] = await core.getStartServices();
        const navLinks = (
          await getNavLinksByNavGroupId(DEFAULT_NAV_GROUPS.settingsAndSetup.id)
        ).filter((navLink) => navLink.id !== settingsLandingPageId);

        return renderApp({
          mountElement: params.element,
          props: {
            navigateToApp: coreStart.application.navigateToApp,
            navLinks,
            pageTitle: settingsLandingPageTitle,
            getStartedCards: [],
          },
        });
      },
    });

    core.application.register({
      id: dataAdministrationLandingPageId,
      title: dataAdministrationPageTitle,
      order: 100,
      navLinkStatus: core.chrome.navGroup.getNavGroupEnabled()
        ? AppNavLinkStatus.visible
        : AppNavLinkStatus.hidden,
      workspaceAvailability: WorkspaceAvailability.outsideWorkspace,
      mount: async (params: AppMountParameters) => {
        const { renderApp } = await import('./landing_page_application');
        const [coreStart] = await core.getStartServices();
        const navLinks = (
          await getNavLinksByNavGroupId(DEFAULT_NAV_GROUPS.dataAdministration.id)
        ).filter((navLink) => navLink.id !== dataAdministrationLandingPageId);

        return renderApp({
          mountElement: params.element,
          props: {
            navigateToApp: coreStart.application.navigateToApp,
            navLinks,
            pageTitle: dataAdministrationPageTitle,
            getStartedCards: [],
          },
        });
      },
    });

    core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.settingsAndSetup, [
      {
        id: settingsLandingPageId,
        order: 0,
      },
    ]);

    core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.dataAdministration, [
      {
        id: dataAdministrationLandingPageId,
        order: 0,
      },
    ]);

    managementOverview?.register({
      id: MANAGEMENT_APP_ID,
      title: this.title,
      description: i18n.translate('management.dashboardManagement.description', {
        defaultMessage:
          'Manage Dashboards saved objects and data source connections. You can also modify advanced settings for Dashboards.',
      }),
      order: 9030,
    });

    return {
      sections: this.managementSections.setup(),
    };
  }

  public start(core: CoreStart) {
    this.managementSections.start({ capabilities: core.application.capabilities });
    this.hasAnyEnabledApps = getSectionsServiceStartPrivate()
      .getSectionsEnabled()
      .some((section) => section.getAppsEnabled().length > 0);

    if (core.chrome.navGroup.getNavGroupEnabled()) {
      this.appUpdater.next(() => {
        return {
          navLinkStatus: AppNavLinkStatus.hidden,
        };
      });
    } else if (!this.hasAnyEnabledApps) {
      this.appUpdater.next(() => {
        return {
          status: AppStatus.inaccessible,
          navLinkStatus: AppNavLinkStatus.hidden,
        };
      });
    }

    if (core.chrome.navGroup.getNavGroupEnabled()) {
      core.chrome.navControls.registerLeftBottom({
        order: 3,
        mount: toMountPoint(
          React.createElement(SettingsIcon, {
            core,
          })
        ),
      });
    }

    return {};
  }
}
