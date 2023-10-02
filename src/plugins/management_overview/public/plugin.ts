/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import {
  AppMountParameters,
  CoreSetup,
  Plugin,
  DEFAULT_APP_CATEGORIES,
  CoreStart,
} from '../../../core/public';
import { FeatureCatalogueCategory, HomePublicPluginSetup } from '../../home/public';
import { MANAGEMENT_OVERVIEW_PLUGIN_ID } from '../common/constants';
import { OverviewApp } from './overview_app';

interface ManagementOverviewSetupDeps {
  home?: HomePublicPluginSetup;
}

export interface ManagementOverViewPluginSetup {
  register: (overviewApp: OverviewApp) => void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ManagementOverViewPluginStart {}

/** @public */
export class ManagementOverViewPlugin
  implements Plugin<ManagementOverViewPluginSetup, ManagementOverViewPluginStart> {
  private readonly overviewApps = new Map<string, OverviewApp>();

  private getSortedOverviewApps(): OverviewApp[] {
    return [...this.overviewApps.values()].sort((a, b) => a.order - b.order);
  }

  public setup(
    coreSetup: CoreSetup,
    { home }: ManagementOverviewSetupDeps
  ): ManagementOverViewPluginSetup {
    const { application, getStartServices } = coreSetup;

    if (home) {
      home.featureCatalogue.register({
        id: MANAGEMENT_OVERVIEW_PLUGIN_ID,
        title: i18n.translate('management.stackManagement.managementLabel', {
          defaultMessage: 'Management',
        }),
        description: i18n.translate('management.stackManagement.managementDescription', {
          defaultMessage: 'Your center location for managing the OpenSearch Stack.',
        }),
        icon: 'managementApp',
        path: `/app/${MANAGEMENT_OVERVIEW_PLUGIN_ID}`,
        showOnHomePage: false,
        category: FeatureCatalogueCategory.ADMIN,
      });
    }

    application.register({
      id: MANAGEMENT_OVERVIEW_PLUGIN_ID,
      title: i18n.translate('management.overview.overviewTitle', {
        defaultMessage: 'Overview',
      }),
      icon: '/ui/logos/opensearch_mark.svg',
      order: 9000,
      category: DEFAULT_APP_CATEGORIES.management,
      mount: async (params: AppMountParameters) => {
        const { element } = params;
        const [core] = await getStartServices();
        const overviewApps = this.getSortedOverviewApps();

        const { renderApp } = await import('./application');
        return renderApp(core, overviewApps, element);
      },
    });

    return {
      register: (app: OverviewApp) => {
        if (this.overviewApps.has(app.id)) {
          throw new Error(
            `Management overview App tool with id [${app.id}] has already been registered. Use a unique id.`
          );
        }
        this.overviewApps.set(app.id, app);
      },
    };
  }

  public start(core: CoreStart): ManagementOverViewPluginStart {
    return {};
  }
}
