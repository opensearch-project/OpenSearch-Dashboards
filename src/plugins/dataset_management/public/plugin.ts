/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
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
  DatasetManagementService,
  DatasetManagementServiceSetup,
  DatasetManagementServiceStart,
} from './service';

import { ManagementSetup } from '../../management/public';
import { AppStatus, AppNavLinkStatus, DEFAULT_NAV_GROUPS } from '../../../core/public';
import { getScopedBreadcrumbs } from '../../opensearch_dashboards_react/public';
import { NavigationPublicPluginStart } from '../../navigation/public';
import { ConfigSchema } from '../common/config';

export interface DatasetManagementSetupDependencies {
  management: ManagementSetup;
  urlForwarding: UrlForwardingSetup;
  dataSource?: DataSourcePluginSetup;
}

export interface DatasetManagementStartDependencies {
  data: DataPublicPluginStart;
  navigation: NavigationPublicPluginStart;
  dataSource?: DataSourcePluginStart;
}

export type DatasetManagementSetup = DatasetManagementServiceSetup;

export type DatasetManagementStart = DatasetManagementServiceStart;

const sectionsHeader = i18n.translate('datasetManagement.dataset.sectionsHeader', {
  defaultMessage: 'Datasets',
});
const sectionsHeaderIndexPattern = i18n.translate(
  'datasetManagement.dataset.sectionsHeaderIndexPattern',
  {
    defaultMessage: 'Index patterns',
  }
);

/**
 * The id is used in src/plugins/workspace/public/plugin.ts and please change that accordingly if you change the id here.
 */
const DM_APP_ID = 'datasets';

export class DatasetManagementPlugin
  implements
    Plugin<
      DatasetManagementSetup,
      DatasetManagementStart,
      DatasetManagementSetupDependencies,
      DatasetManagementStartDependencies
    > {
  private config: ConfigSchema;
  private readonly datasetManagementService = new DatasetManagementService();

  constructor(initializerContext: PluginInitializerContext) {
    this.config = initializerContext.config.get<ConfigSchema>();
  }

  public setup(
    core: CoreSetup<DatasetManagementStartDependencies, DatasetManagementStart>,
    dependencies: DatasetManagementSetupDependencies
  ) {
    const { urlForwarding, management, dataSource } = dependencies;

    const opensearchDashboardsSection = management.sections.section.opensearchDashboards;

    if (!opensearchDashboardsSection) {
      throw new Error('`opensearchDashboards` management section not found.');
    }

    const newAppPath = `management/opensearch-dashboards/${DM_APP_ID}`;
    const legacyPatternsPath = 'management/opensearch-dashboards/datasets';

    urlForwarding.forwardApp(
      'management/opensearch-dashboards/dataset',
      newAppPath,
      (path) => '/create'
    );
    urlForwarding.forwardApp(legacyPatternsPath, newAppPath, (path) => {
      const pathInApp = path.substr(legacyPatternsPath.length + 1);
      return pathInApp && `/patterns${pathInApp}`;
    });

    // Forward indexPatterns management page to datasets management page
    urlForwarding.forwardApp('indexPatterns', DM_APP_ID, (path) => {
      // Transform indexPatterns paths to datasets paths
      // e.g., /indexPatterns/patterns/123 -> /patterns/123
      const transformedPath = path.replace(/^\/indexPatterns/, '');
      return transformedPath || '/';
    });

    // Register indexPatterns app as a redirect to datasets app (for direct app URLs)
    core.application.register({
      id: 'indexPatterns',
      title: 'Index Patterns (Redirecting...)',
      navLinkStatus: AppNavLinkStatus.hidden,
      chromeless: true,
      mount: async (params: AppMountParameters) => {
        const [coreStart] = await core.getStartServices();
        const targetPath = params.history.location.pathname + params.history.location.search;
        // Redirect to datasets app with the same path
        coreStart.application.navigateToApp(DM_APP_ID, {
          path: targetPath,
          replace: true,
        });
        return () => {};
      },
    });

    opensearchDashboardsSection.registerApp({
      id: DM_APP_ID,
      title: this.config.aliasedAsIndexPattern ? sectionsHeaderIndexPattern : sectionsHeader,
      order: 0,
      mount: async (params) => {
        if (core.chrome.navGroup.getNavGroupEnabled()) {
          const [coreStart] = await core.getStartServices();
          const urlForStandardIPMApp = new URL(
            coreStart.application.getUrlForApp(DM_APP_ID),
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
          () => this.datasetManagementService.environmentService.getEnvironment().ml(),
          dataSource
        );
      },
    });

    core.application.register({
      id: DM_APP_ID,
      title: this.config.aliasedAsIndexPattern ? sectionsHeaderIndexPattern : sectionsHeader,
      description: i18n.translate('datasetManagement.dataset.description', {
        defaultMessage: 'Manage datasets to retrieve your data.',
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
          () => this.datasetManagementService.environmentService.getEnvironment().ml(),
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
            id: DM_APP_ID,
            title: this.config.aliasedAsIndexPattern ? sectionsHeaderIndexPattern : sectionsHeader,
            order: 400,
          },
        ]);
      }
    });

    return this.datasetManagementService.setup({ httpClient: core.http });
  }

  public start(core: CoreStart, plugins: DatasetManagementStartDependencies) {
    return this.datasetManagementService.start();
  }

  public stop() {
    this.datasetManagementService.stop();
  }
}
