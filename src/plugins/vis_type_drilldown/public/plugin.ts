/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { AppMountParameters, CoreSetup, CoreStart, Plugin } from '../../../core/public';
import {
  VisDrilldownPluginSetup,
  VisDrilldownPluginStart,
  AppPluginStartDependencies,
} from './types';
import { PLUGIN_NAME } from '../common';
import { drillDownVisDefinition } from './drilldown_vis';

export class VisDrilldownPlugin
  implements Plugin<VisDrilldownPluginSetup, VisDrilldownPluginStart> {
  public setup(
    core: CoreSetup,
    { visualizations }: AppPluginStartDependencies
  ): VisDrilldownPluginSetup {
    visualizations.createBaseVisualization(drillDownVisDefinition);
    // Register an application into the side navigation menu
    core.application.register({
      id: 'visTypeDrilldown',
      title: PLUGIN_NAME,
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
        return i18n.translate('visTypeDrilldown.greetingText', {
          defaultMessage: 'Hello from {name}!',
          values: {
            name: PLUGIN_NAME,
          },
        });
      },
    };
  }

  public start(core: CoreStart): VisDrilldownPluginStart {
    return {};
  }

  public stop() {}
}
