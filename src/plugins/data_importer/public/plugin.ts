/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AppMountParameters,
  CoreSetup,
  CoreStart,
  DEFAULT_APP_CATEGORIES,
  DEFAULT_NAV_GROUPS,
  Plugin,
  PluginInitializerContext,
  WorkspaceAvailability,
} from '../../../core/public';
import {
  DataImporterPluginSetup,
  DataImporterPluginSetupDeps,
  DataImporterPluginStart,
  DataImporterPluginStartDependencies,
} from './types';
import { PLUGIN_ID, PLUGIN_DESCRIPTION, PLUGIN_NAME_AS_TITLE } from '../common';
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
      description: PLUGIN_DESCRIPTION,
      workspaceAvailability: WorkspaceAvailability.outsideWorkspace,
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

    core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.dataAdministration, [
      {
        id: PLUGIN_ID,
        category: DEFAULT_APP_CATEGORIES.manageData,
        order: 450,
      },
    ]);

    return {};
  }

  public start(_: CoreStart): DataImporterPluginStart {
    return {};
  }

  public stop() {}
}
