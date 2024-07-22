/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataSourcePluginSetup } from 'src/plugins/data_source/public';
import {
  AppMountParameters,
  CoreSetup,
  CoreStart,
  DEFAULT_APP_CATEGORIES,
  DEFAULT_NAV_GROUPS,
  Plugin,
} from '../../../core/public';

import { PLUGIN_NAME } from '../common';
import { createDataSourceSelector } from './components/data_source_selector/create_data_source_selector';

import { ManagementSetup } from '../../management/public';
import { IndexPatternManagementSetup } from '../../index_pattern_management/public';
import { DataSourceColumn } from './components/data_source_column/data_source_column';
import {
  AuthenticationMethod,
  IAuthenticationMethodRegistry,
  AuthenticationMethodRegistry,
} from './auth_registry';
import { noAuthCredentialAuthMethod, sigV4AuthMethod, usernamePasswordAuthMethod } from './types';
import { DataSourceSelectorProps } from './components/data_source_selector/data_source_selector';
import { createDataSourceMenu } from './components/data_source_menu/create_data_source_menu';
import { DataSourceMenuProps } from './components/data_source_menu';
import {
  setApplication,
  setHideLocalCluster,
  setUiSettings,
  setDataSourceSelection,
  getDefaultDataSourceId,
  getDefaultDataSourceId$,
} from './components/utils';
import { DataSourceSelectionService } from './service/data_source_selection_service';

export interface DataSourceManagementSetupDependencies {
  management: ManagementSetup;
  indexPatternManagement: IndexPatternManagementSetup;
  dataSource?: DataSourcePluginSetup;
}

export interface DataSourceManagementPluginSetup {
  registerAuthenticationMethod: (authMethodValues: AuthenticationMethod) => void;
  ui: {
    DataSourceSelector: React.ComponentType<DataSourceSelectorProps> | null;
    getDataSourceMenu: <T>() => React.ComponentType<DataSourceMenuProps<T>>;
  };
  dataSourceSelection: DataSourceSelectionService;
  getDefaultDataSourceId: typeof getDefaultDataSourceId;
  getDefaultDataSourceId$: typeof getDefaultDataSourceId$;
}

export interface DataSourceManagementPluginStart {
  getAuthenticationMethodRegistry: () => IAuthenticationMethodRegistry;
}

export const DSM_APP_ID = 'dataSources';

export class DataSourceManagementPlugin
  implements
    Plugin<
      DataSourceManagementPluginSetup,
      DataSourceManagementPluginStart,
      DataSourceManagementSetupDependencies
    > {
  private started = false;
  private authMethodsRegistry = new AuthenticationMethodRegistry();
  private dataSourceSelection = new DataSourceSelectionService();

  public setup(
    core: CoreSetup<DataSourceManagementPluginStart>,
    { management, indexPatternManagement, dataSource }: DataSourceManagementSetupDependencies
  ) {
    const opensearchDashboardsSection = management.sections.section.opensearchDashboards;
    const uiSettings = core.uiSettings;

    if (!opensearchDashboardsSection) {
      throw new Error('`opensearchDashboards` management section not found.');
    }

    const savedObjectPromise = core
      .getStartServices()
      .then(([coreStart]) => coreStart.savedObjects);

    const column = new DataSourceColumn(savedObjectPromise);
    indexPatternManagement.columns.register(column);

    const featureFlagStatus = !!dataSource;

    opensearchDashboardsSection.registerApp({
      id: DSM_APP_ID,
      title: PLUGIN_NAME,
      order: 1,
      mount: async (params) => {
        const { mountManagementSection } = await import('./management_app');

        return mountManagementSection(
          core.getStartServices,
          params,
          this.authMethodsRegistry,
          featureFlagStatus
        );
      },
    });

    // when the feature flag is disabled, we don't need to register any of the mds components
    if (!featureFlagStatus) {
      return undefined;
    }

    /**
     * The data sources features in observability has the same name as `DSM_APP_ID`
     * Add a suffix to avoid duplication
     */
    const DSM_APP_ID_FOR_STANDARD_APPLICATION = `${DSM_APP_ID}_core`;

    if (core.chrome.navGroup.getNavGroupEnabled()) {
      core.application.register({
        id: DSM_APP_ID_FOR_STANDARD_APPLICATION,
        title: PLUGIN_NAME,
        order: 100,
        mount: async (params: AppMountParameters) => {
          const { mountManagementSection } = await import('./management_app');
          const [coreStart] = await core.getStartServices();

          return mountManagementSection(
            core.getStartServices,
            {
              ...params,
              basePath: core.http.basePath.get(),
              setBreadcrumbs: coreStart.chrome.setBreadcrumbs,
              wrapInPage: true,
            },
            this.authMethodsRegistry,
            featureFlagStatus
          );
        },
      });
    }

    core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.dataAdministration, [
      {
        id: DSM_APP_ID_FOR_STANDARD_APPLICATION,
        category: DEFAULT_APP_CATEGORIES.manageData,
        order: 100,
      },
    ]);

    core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.observability, [
      {
        id: DSM_APP_ID_FOR_STANDARD_APPLICATION,
        category: DEFAULT_APP_CATEGORIES.manage,
        order: 100,
      },
    ]);

    core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.search, [
      {
        id: DSM_APP_ID_FOR_STANDARD_APPLICATION,
        category: DEFAULT_APP_CATEGORIES.manage,
        order: 100,
      },
    ]);

    core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS['security-analytics'], [
      {
        id: DSM_APP_ID_FOR_STANDARD_APPLICATION,
        category: DEFAULT_APP_CATEGORIES.manage,
        order: 100,
      },
    ]);

    core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.analytics, [
      {
        id: DSM_APP_ID_FOR_STANDARD_APPLICATION,
        category: DEFAULT_APP_CATEGORIES.manage,
        order: 100,
      },
    ]);

    core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.all, [
      {
        id: DSM_APP_ID_FOR_STANDARD_APPLICATION,
        category: DEFAULT_APP_CATEGORIES.manage,
        order: 100,
      },
    ]);

    const registerAuthenticationMethod = (authMethod: AuthenticationMethod) => {
      if (this.started) {
        throw new Error(
          'cannot call `registerAuthenticationMethod` after data source management startup.'
        );
      }
      this.authMethodsRegistry.registerAuthenticationMethod(authMethod);
    };

    if (dataSource.noAuthenticationTypeEnabled) {
      registerAuthenticationMethod(noAuthCredentialAuthMethod);
    }
    if (dataSource.usernamePasswordAuthEnabled) {
      registerAuthenticationMethod(usernamePasswordAuthMethod);
    }
    if (dataSource.awsSigV4AuthEnabled) {
      registerAuthenticationMethod(sigV4AuthMethod);
    }

    setHideLocalCluster({ enabled: dataSource.hideLocalCluster });
    setUiSettings(uiSettings);
    // This instance will be got in each data source selector component.
    setDataSourceSelection(this.dataSourceSelection);

    return {
      registerAuthenticationMethod,
      // Other plugins can get this instance from setupDeps and use to get selected data sources.
      dataSourceSelection: this.dataSourceSelection,
      ui: {
        DataSourceSelector: createDataSourceSelector(uiSettings, dataSource),
        getDataSourceMenu: <T>() => createDataSourceMenu<T>(),
      },
      getDefaultDataSourceId,
      getDefaultDataSourceId$,
    };
  }

  public start(core: CoreStart) {
    this.started = true;
    setApplication(core.application);
    return {
      getAuthenticationMethodRegistry: () => this.authMethodsRegistry,
    };
  }

  public stop() {}
}
