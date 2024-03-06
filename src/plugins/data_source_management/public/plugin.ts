/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataSourcePluginSetup } from 'src/plugins/data_source/public';
import { CoreSetup, CoreStart, Plugin } from '../../../core/public';

import { PLUGIN_NAME } from '../common';
import { createDataSourceSelector } from './components/data_source_selector/create_data_source_selector';

import { ManagementSetup } from '../../management/public';
import { IndexPatternManagementSetup } from '../../index_pattern_management/public';
import { DataSourceColumn } from './components/data_source_column/data_source_column';
import {
  AuthenticationMethod,
  IAuthenticationMethodRegistery,
  AuthenticationMethodRegistery,
} from './auth_registry';
import { noAuthCredentialAuthMethod, sigV4AuthMethod, usernamePasswordAuthMethod } from './types';
import { DataSourceSelectorProps } from './components/data_source_selector/data_source_selector';

export interface DataSourceManagementSetupDependencies {
  management: ManagementSetup;
  indexPatternManagement: IndexPatternManagementSetup;
  dataSource: DataSourcePluginSetup;
}

export interface DataSourceManagementPluginSetup {
  registerAuthenticationMethod: (authMethodValues: AuthenticationMethod) => void;
  getDataSourceSelector: React.ComponentType<DataSourceSelectorProps>;
}

export interface DataSourceManagementPluginStart {
  getAuthenticationMethodRegistery: () => IAuthenticationMethodRegistery;
}

const DSM_APP_ID = 'dataSources';

export class DataSourceManagementPlugin
  implements
    Plugin<
      DataSourceManagementPluginSetup,
      DataSourceManagementPluginStart,
      DataSourceManagementSetupDependencies
    > {
  private started = false;
  private authMethodsRegistry = new AuthenticationMethodRegistery();

  public setup(
    core: CoreSetup<DataSourceManagementPluginStart>,
    { management, indexPatternManagement, dataSource }: DataSourceManagementSetupDependencies
  ) {
    const opensearchDashboardsSection = management.sections.section.opensearchDashboards;

    if (!opensearchDashboardsSection) {
      throw new Error('`opensearchDashboards` management section not found.');
    }

    const savedObjectPromise = core
      .getStartServices()
      .then(([coreStart]) => coreStart.savedObjects);
    const httpPromise = core.getStartServices().then(([coreStart]) => coreStart.http);
    const column = new DataSourceColumn(savedObjectPromise, httpPromise);
    indexPatternManagement.columns.register(column);

    opensearchDashboardsSection.registerApp({
      id: DSM_APP_ID,
      title: PLUGIN_NAME,
      order: 1,
      mount: async (params) => {
        const { mountManagementSection } = await import('./management_app');

        return mountManagementSection(core.getStartServices, params, this.authMethodsRegistry);
      },
    });

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

    return {
      registerAuthenticationMethod,
      getDataSourceSelector: createDataSourceSelector(),
    };
  }

  public start(core: CoreStart) {
    this.started = true;
    return {
      getAuthenticationMethodRegistery: () => this.authMethodsRegistry,
    };
  }

  public stop() {}
}
