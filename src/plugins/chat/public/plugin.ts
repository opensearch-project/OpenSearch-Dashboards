/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { CoreSetup, CoreStart, Plugin } from '../../../core/public';
import { ChatPluginSetup, ChatPluginStart } from './types';

export class ChatPlugin implements Plugin<ChatPluginSetup, ChatPluginStart> {
  public setup(core: CoreSetup): ChatPluginSetup {
    // Register an application into the side navigation menu
    // core.application.register({
    //   id: 'chat',
    //   title: PLUGIN_NAME,
    //   async mount(params: AppMountParameters) {
    //     // Load application bundle
    //     const { renderApp } = await import('./application');
    //     // Get start services as specified in opensearch_dashboards.json
    //     const [coreStart, depsStart] = await core.getStartServices();
    //     // Render the application
    //     return renderApp(coreStart, depsStart as AppPluginStartDependencies, params);
    //   },
    // });

    // Return methods that should be available to other plugins
    return {};
  }

  public start(core: CoreStart): ChatPluginStart {
    return {};
  }

  public stop() {}
}
