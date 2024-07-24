/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DataSourcePluginSetup } from 'src/plugins/data_source/public';
import {
  AppMountParameters,
  CoreSetup,
  CoreStart,
  DEFAULT_APP_CATEGORIES,
  DEFAULT_NAV_GROUPS,
  MountPoint,
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
import { catalogRequestIntercept } from '../framework/catalog_cache/cache_intercept';
import { createGetterSetter } from '../../../../src/plugins/opensearch_dashboards_utils/public';
import { toMountPoint } from '../../../../src/plugins/opensearch_dashboards_react/public';
import {
  RenderAccelerationDetailsFlyoutParams,
  RenderAccelerationFlyoutParams,
  RenderAssociatedObjectsDetailsFlyoutParams,
} from '../framework/types';
import { AccelerationDetailsFlyout } from './components/direct_query_data_sources_components/acceleration_management/acceleration_details_flyout';
import { CreateAcceleration } from './components/direct_query_data_sources_components/acceleration_creation/create/create_acceleration';
import { AssociatedObjectsDetailsFlyout } from './components/direct_query_data_sources_components/associated_object_management/associated_objects_details_flyout';
import { getScopedBreadcrumbs } from '../../opensearch_dashboards_react/public';

export const [
  getRenderAccelerationDetailsFlyout,
  setRenderAccelerationDetailsFlyout,
] = createGetterSetter<(params: RenderAccelerationDetailsFlyoutParams) => void>(
  'renderAccelerationDetailsFlyout'
);

export const [
  getRenderCreateAccelerationFlyout,
  setRenderCreateAccelerationFlyout,
] = createGetterSetter<(params: RenderAccelerationFlyoutParams) => void>(
  'renderCreateAccelerationFlyout'
);
export const [
  getRenderAssociatedObjectsDetailsFlyout,
  setRenderAssociatedObjectsDetailsFlyout,
] = createGetterSetter<(params: RenderAssociatedObjectsDetailsFlyoutParams) => void>(
  'renderAssociatedObjectsDetailsFlyout'
);

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
  private featureFlagStatus: boolean = false;
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

    this.featureFlagStatus = !!dataSource;

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
          this.featureFlagStatus
        );
      },
    });

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
              setBreadcrumbs: (breadCrumbs) =>
                coreStart.chrome.setBreadcrumbs(getScopedBreadcrumbs(breadCrumbs, params.history)),
              wrapInPage: true,
            },
            this.authMethodsRegistry,
            this.featureFlagStatus
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

    // when the feature flag is disabled, we don't need to register any of the mds components
    if (!this.featureFlagStatus) {
      return undefined;
    }

    const registerAuthenticationMethod = (authMethod: AuthenticationMethod) => {
      if (this.started) {
        throw new Error(
          'cannot call `registerAuthenticationMethod` after data source management startup.'
        );
      }
      this.authMethodsRegistry.registerAuthenticationMethod(authMethod);
    };

    if (dataSource!.noAuthenticationTypeEnabled) {
      registerAuthenticationMethod(noAuthCredentialAuthMethod);
    }
    if (dataSource!.usernamePasswordAuthEnabled) {
      registerAuthenticationMethod(usernamePasswordAuthMethod);
    }
    if (dataSource!.awsSigV4AuthEnabled) {
      registerAuthenticationMethod(sigV4AuthMethod);
    }

    setHideLocalCluster({ enabled: dataSource!.hideLocalCluster });
    setUiSettings(uiSettings);
    // This instance will be got in each data source selector component.
    setDataSourceSelection(this.dataSourceSelection);

    return {
      registerAuthenticationMethod,
      // Other plugins can get this instance from setupDeps and use to get selected data sources.
      dataSourceSelection: this.dataSourceSelection,
      ui: {
        DataSourceSelector: createDataSourceSelector(uiSettings, dataSource!),
        getDataSourceMenu: <T>() => createDataSourceMenu<T>(),
      },
      getDefaultDataSourceId,
      getDefaultDataSourceId$,
    };
  }

  public start(core: CoreStart) {
    this.started = true;
    setApplication(core.application);
    core.http.intercept({
      request: catalogRequestIntercept(),
    });

    const renderAccelerationDetailsFlyout = ({
      acceleration,
      dataSourceName,
      handleRefresh,
      dataSourceMDSId,
    }: RenderAccelerationDetailsFlyoutParams) => {
      const accelerationDetailsFlyout = core.overlays.openFlyout(
        toMountPoint(
          React.createElement(AccelerationDetailsFlyout, {
            featureFlagStatus: this.featureFlagStatus, // Use the stored featureFlagStatus
            acceleration,
            dataSourceName,
            resetFlyout: () => accelerationDetailsFlyout.close(),
            handleRefresh,
            dataSourceMDSId,
            http: core.http,
            notifications: core.notifications,
            application: core.application,
          })
        ) as MountPoint
      );
    };
    setRenderAccelerationDetailsFlyout(renderAccelerationDetailsFlyout);

    const renderCreateAccelerationFlyout = ({
      dataSourceName,
      databaseName,
      tableName,
      handleRefresh,
      dataSourceMDSId,
    }: RenderAccelerationFlyoutParams) => {
      const createAccelerationFlyout = core.overlays.openFlyout(
        toMountPoint(
          React.createElement(CreateAcceleration, {
            selectedDatasource: dataSourceName,
            resetFlyout: () => createAccelerationFlyout.close(),
            databaseName,
            tableName,
            refreshHandler: handleRefresh,
            dataSourceMDSId,
            http: core.http,
            notifications: core.notifications,
            application: core.application,
          })
        ) as MountPoint
      );
    };
    setRenderCreateAccelerationFlyout(renderCreateAccelerationFlyout);

    const renderAssociatedObjectsDetailsFlyout = ({
      tableDetail,
      dataSourceName,
      handleRefresh,
      dataSourceMDSId,
    }: RenderAssociatedObjectsDetailsFlyoutParams) => {
      const associatedObjectsDetailsFlyout = core.overlays.openFlyout(
        toMountPoint(
          React.createElement(AssociatedObjectsDetailsFlyout, {
            tableDetail,
            datasourceName: dataSourceName,
            resetFlyout: () => associatedObjectsDetailsFlyout.close(),
            handleRefresh,
            dataSourceMDSId,
            http: core.http,
            notifications: core.notifications,
            application: core.application,
          })
        ) as MountPoint
      );
    };
    setRenderAssociatedObjectsDetailsFlyout(renderAssociatedObjectsDetailsFlyout);

    return {
      getAuthenticationMethodRegistry: () => this.authMethodsRegistry,
    };
  }

  public stop() {}
}
