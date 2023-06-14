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
import { BehaviorSubject } from 'rxjs';
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
} from '../../../core/public';

import { MANAGEMENT_APP_ID } from '../common/contants';
import {
  ManagementSectionsService,
  getSectionsServiceStartPrivate,
} from './management_sections_service';
import { PluginPages } from '../../../core/types';
import { ManagementOverViewPluginStart } from '../../management_overview/public';

interface ManagementSetupDependencies {
  home?: HomePublicPluginSetup;
}

interface ManagementStartDependencies {
  managementOverview?: ManagementOverViewPluginStart;
}

export class ManagementPlugin implements Plugin<ManagementSetup, ManagementStart> {
  private readonly managementSections = new ManagementSectionsService();

  private readonly appUpdater = new BehaviorSubject<AppUpdater>(() => ({}));

  private hasAnyEnabledApps = true;

  constructor(private initializerContext: PluginInitializerContext) {}

  public setup(core: CoreSetup, { home }: ManagementSetupDependencies) {
    const opensearchDashboardsVersion = this.initializerContext.env.packageInfo.version;

    core.application.register({
      id: MANAGEMENT_APP_ID,
      title: i18n.translate('management.stackManagement.title', {
        defaultMessage: 'Dashboard Management',
      }),
      order: 9030,
      icon: '/plugins/home/assets/logos/opensearch_mark_default.svg',
      category: DEFAULT_APP_CATEGORIES.management,
      updater$: this.appUpdater,
      async mount(params: AppMountParameters) {
        const { renderApp } = await import('./application');
        const [coreStart] = await core.getStartServices();

        return renderApp(params, {
          sections: getSectionsServiceStartPrivate(),
          opensearchDashboardsVersion,
          setBreadcrumbs: coreStart.chrome.setBreadcrumbs,
        });
      },
    });

    return {
      sections: this.managementSections.setup(),
    };
  }

  public start(core: CoreStart, { managementOverview }: ManagementStartDependencies) {
    this.managementSections.start({ capabilities: core.application.capabilities });
    this.hasAnyEnabledApps = getSectionsServiceStartPrivate()
      .getSectionsEnabled()
      .some((section) => section.getAppsEnabled().length > 0);

    if (!this.hasAnyEnabledApps) {
      this.appUpdater.next(() => {
        return {
          status: AppStatus.inaccessible,
          navLinkStatus: AppNavLinkStatus.hidden,
        };
      });
    }

    if (managementOverview) {
      const enabledSections = getSectionsServiceStartPrivate().getSectionsEnabled();
      const pluginPages: PluginPages[] = enabledSections
        .map((section) => section.apps)
        .flat()
        .map((app) => {
          return {
            title: app.title,
            url: app.basePath,
            order: app.order,
          };
        });

      if (pluginPages) {
        managementOverview.register({
          id: MANAGEMENT_APP_ID,
          title: i18n.translate('management.stackManagement.title', {
            defaultMessage: 'Dashboard Management',
          }),
          order: 9030,
          pages: pluginPages,
        });
      }
    }

    return {};
  }
}
