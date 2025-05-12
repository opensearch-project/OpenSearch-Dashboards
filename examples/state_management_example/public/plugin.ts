/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppMountParameters, CoreSetup, CoreStart, Plugin } from '../../../src/core/public';
import {
  StateManagementExamplePluginSetup,
  StateManagementExamplePluginStart,
  AppPluginStartDependencies,
} from './types';
import { COUNTER_SERVICE_PLUGIN_KEY, PLUGIN_NAME } from '../common';
import { CounterService } from './counter_service';
import { globalStoreServiceRegister } from '../../../src/plugins/opensearch_dashboards_react/public';
import { DeveloperExamplesSetup } from '../../developer_examples/public';

interface SetupDeps {
  developerExamples: DeveloperExamplesSetup;
}

export class StateManagementExamplePlugin
  implements Plugin<StateManagementExamplePluginSetup, StateManagementExamplePluginStart> {
  public setup(core: CoreSetup, { developerExamples }: SetupDeps) {
    // Register an application into the side navigation menu
    const counterService = new CounterService();
    const counterServiceStart = counterService.start();

    globalStoreServiceRegister(
      COUNTER_SERVICE_PLUGIN_KEY,
      counterServiceStart.selectors,
      counterServiceStart.actions
    );

    core.application.register({
      id: 'stateManagementExample',
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

    developerExamples.register({
      appId: 'stateManagementExample',
      title: 'State Management Example: Counter',
      description: `State Management Example: Counter`,
    });

    // Return methods that should be available to other plugins
    return {};
  }

  public start(core: CoreStart): StateManagementExamplePluginStart {
    return {};
  }

  public stop() {}
}
