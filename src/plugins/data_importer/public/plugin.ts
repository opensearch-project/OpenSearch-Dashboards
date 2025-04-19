/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AppMountParameters,
  CoreSetup,
  CoreStart,
  Plugin,
  PluginInitializerContext,
} from '../../../core/public';
import {
  DataImporterPluginSetup,
  DataImporterPluginSetupDeps,
  DataImporterPluginStart,
  DataImporterPluginStartDependencies,
} from './types';
import { PLUGIN_ID, PLUGIN_NAME_AS_TITLE } from '../common';
import { ConfigSchema } from '../config';

export class DataImporterPlugin
  implements Plugin<DataImporterPluginSetup, DataImporterPluginStart> {
  private readonly config: ConfigSchema;

  constructor(initializerContext: PluginInitializerContext<ConfigSchema>) {
    this.config = initializerContext.config.get();
  }

  public setup(core: CoreSetup, setupDeps: DataImporterPluginSetupDeps): DataImporterPluginSetup {
    const config = this.config;

    // Register an application into the side navigation menu
    core.application.register({
      id: PLUGIN_ID,
      title: PLUGIN_NAME_AS_TITLE,
      async mount(params: AppMountParameters) {
        // Load application bundle
        const { renderApp } = await import('./application');
        // Get start services as specified in opensearch_dashboards.json
        const [coreStart, depsStart] = await core.getStartServices();
        // Render the application
        return renderApp(
          coreStart,
          depsStart as DataImporterPluginStartDependencies,
          params,
          setupDeps,
          config
        );
      },
    });

    return {};
  }

  public start(_: CoreStart): DataImporterPluginStart {
    return {};
  }

  public stop() {}
}
