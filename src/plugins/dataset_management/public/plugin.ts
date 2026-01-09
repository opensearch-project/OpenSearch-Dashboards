/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { BehaviorSubject, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { CoreSetup, CoreStart, Plugin, AppMountParameters } from 'src/core/public';
import { DataPublicPluginStart } from 'src/plugins/data/public';
import { DataSourcePluginSetup, DataSourcePluginStart } from 'src/plugins/data_source/public';
import { UrlForwardingSetup } from '../../url_forwarding/public';
import {
  DatasetManagementService,
  DatasetManagementServiceSetup,
  DatasetManagementServiceStart,
} from './service';

import { ManagementSetup } from '../../management/public';
import {
  AppStatus,
  AppNavLinkStatus,
  DEFAULT_NAV_GROUPS,
  isNavGroupInFeatureConfigs,
  AppUpdater,
} from '../../../core/public';
import { getScopedBreadcrumbs } from '../../opensearch_dashboards_react/public';
import { NavigationPublicPluginStart } from '../../navigation/public';

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
  private readonly datasetManagementService = new DatasetManagementService();
  private readonly appUpdater$ = new BehaviorSubject<AppUpdater>(() => ({}));
  private workspaceSubscription?: Subscription;

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

    // Register in management section only for observability workspace
    // Check workspace in mount to prevent access in non-observability workspaces
    opensearchDashboardsSection.registerApp({
      id: DM_APP_ID,
      title: sectionsHeader,
      order: 1,
      mount: async (params) => {
        const [coreStart] = await core.getStartServices();

        // Check if we're in an observability workspace
        const features = await coreStart.workspaces.currentWorkspace$
          .pipe(take(1))
          .toPromise()
          .then((workspace) => workspace?.features)
          .catch(() => {
            // Fallback to non-workspace mode if workspace isn't available
            return undefined;
          });

        const isObservabilityWorkspace =
          (features && isNavGroupInFeatureConfigs(DEFAULT_NAV_GROUPS.observability.id, features)) ??
          false;

        // If not in observability workspace, don't allow access
        if (!isObservabilityWorkspace && coreStart.application.capabilities.workspaces.enabled) {
          // Redirect to index patterns instead
          const indexPatternsUrl = coreStart.application.getUrlForApp('indexPatterns');
          coreStart.application.navigateToUrl(indexPatternsUrl);
          return () => {};
        }

        if (core.chrome.navGroup.getNavGroupEnabled()) {
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
      title: sectionsHeader,
      description: i18n.translate('datasetManagement.dataset.description', {
        defaultMessage: 'Manage datasets to retrieve your data.',
      }),
      status: core.chrome.navGroup.getNavGroupEnabled()
        ? AppStatus.accessible
        : AppStatus.inaccessible,
      updater$: this.appUpdater$,
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
       * Only show datasets in observability workspace when workspaces are enabled.
       * Do not show datasets when workspaces are disabled.
       */
      if (coreStart.application.capabilities.workspaces.enabled) {
        // Subscribe to workspace changes to control nav link visibility
        this.workspaceSubscription = coreStart.workspaces.currentWorkspace$.subscribe(
          (workspace) => {
            const features = workspace?.features;

            const isObservabilityWorkspace =
              (features &&
                isNavGroupInFeatureConfigs(DEFAULT_NAV_GROUPS.observability.id, features)) ??
              false;

            // Update nav link visibility based on workspace
            this.appUpdater$.next(() => ({
              navLinkStatus: isObservabilityWorkspace
                ? AppNavLinkStatus.visible
                : AppNavLinkStatus.hidden,
            }));
          }
        );
      }
    });

    return this.datasetManagementService.setup({ httpClient: core.http });
  }

  public start(core: CoreStart, plugins: DatasetManagementStartDependencies) {
    return this.datasetManagementService.start();
  }

  public stop() {
    if (this.workspaceSubscription) {
      this.workspaceSubscription.unsubscribe();
      this.workspaceSubscription = undefined;
    }
    this.datasetManagementService.stop();
  }
}
