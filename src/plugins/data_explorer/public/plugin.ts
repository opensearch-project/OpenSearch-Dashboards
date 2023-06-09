/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import {
  AppMountParameters,
  CoreSetup,
  CoreStart,
  Plugin,
  AppNavLinkStatus,
} from '../../../core/public';
import {
  DataExplorerPluginSetup,
  DataExplorerPluginStart,
  AppPluginStartDependencies,
} from './types';
import { PLUGIN_NAME } from '../common';

export class DataExplorerPlugin
  implements Plugin<DataExplorerPluginSetup, DataExplorerPluginStart> {
  public setup(core: CoreSetup): DataExplorerPluginSetup {
    // Register an application into the side navigation menu
    core.application.register({
      id: 'dataExplorer',
      title: PLUGIN_NAME,
      navLinkStatus: AppNavLinkStatus.hidden,
      async mount(params: AppMountParameters) {
        // Load application bundle
        const { renderApp } = await import('./application');
        // Get start services as specified in opensearch_dashboards.json
        const [coreStart, depsStart] = await core.getStartServices();
        // Render the application
        return renderApp(coreStart, depsStart as AppPluginStartDependencies, params);
      },
    });

    // Return methods that should be available to other plugins
    return {
      getGreeting() {
        return i18n.translate('dataExplorer.greetingText', {
          defaultMessage: 'Hello from {name}!',
          values: {
            name: PLUGIN_NAME,
          },
        });
      },
    };
  }

  public start(core: CoreStart): DataExplorerPluginStart {
    return {};
  }

  public stop() {}
}
