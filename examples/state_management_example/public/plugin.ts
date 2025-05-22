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
import { COUNTER_SERVICE_PLUGIN_KEY, REDUX_COUNTER_KEY, PLUGIN_NAME } from '../common';
import { ObservableBasedCounterService } from './observable_counter_service';
import { globalStoreServiceRegister } from '../../../src/plugins/opensearch_dashboards_react/public';
import { DeveloperExamplesSetup } from '../../developer_examples/public';
import { ReduxBasedCounterService } from './redux_counter_service';

interface SetupDeps {
  developerExamples: DeveloperExamplesSetup;
}

export class StateManagementExamplePlugin
  implements Plugin<StateManagementExamplePluginSetup, StateManagementExamplePluginStart> {
  public setup(core: CoreSetup, { developerExamples }: SetupDeps) {
    // Register an application into the side navigation menu
    // Initialize Observable-based counter (original approach)
    const observableCounterService = new ObservableBasedCounterService();
    const observableCounterServiceStart = observableCounterService.start();

    globalStoreServiceRegister(
      COUNTER_SERVICE_PLUGIN_KEY,
      observableCounterServiceStart.selectors,
      observableCounterServiceStart.actions
    );

    const reduxCounterService = new ReduxBasedCounterService();
    const reduxCounterServiceStart = reduxCounterService.start();

    globalStoreServiceRegister(
      REDUX_COUNTER_KEY,
      reduxCounterServiceStart.selectors,
      reduxCounterServiceStart.actions
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
