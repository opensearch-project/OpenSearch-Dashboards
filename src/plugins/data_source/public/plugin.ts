/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CoreSetup,
  CoreStart,
  Plugin,
  PluginInitializerContext,
} from 'opensearch-dashboards/public';
import { DataSourcePluginSetup, DataSourcePluginStart } from './types';
import { DataSourcePluginConfigType } from '../config';

export class DataSourcePlugin implements Plugin<DataSourcePluginSetup, DataSourcePluginStart> {
  constructor(
    private readonly initializerContext: PluginInitializerContext<DataSourcePluginConfigType>
  ) {}

  public setup(core: CoreSetup): DataSourcePluginSetup {
    const config = this.initializerContext.config.get();
    return {
      dataSourceEnabled: config.enabled,
      hideLocalCluster: config.hideLocalCluster,
      noAuthenticationTypeEnabled: config.authTypes.NoAuthentication.enabled,
      usernamePasswordAuthEnabled: config.authTypes.UsernamePassword.enabled,
      awsSigV4AuthEnabled: config.authTypes.AWSSigV4.enabled,
    };
  }

  public start(core: CoreStart): DataSourcePluginStart {
    const config = this.initializerContext.config.get();
    return {
      dataSourceEnabled: config.enabled,
      hideLocalCluster: config.hideLocalCluster,
      noAuthenticationTypeEnabled: config.authTypes.NoAuthentication.enabled,
      usernamePasswordAuthEnabled: config.authTypes.UsernamePassword.enabled,
      awsSigV4AuthEnabled: config.authTypes.AWSSigV4.enabled,
    };
  }

  public stop() {}
}
