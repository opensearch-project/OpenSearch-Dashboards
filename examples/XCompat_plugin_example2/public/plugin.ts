import { i18n } from '@osd/i18n';
import {
  AppMountParameters,
  CoreSetup,
  CoreStart,
  Plugin,
  DEFAULT_APP_CATEGORIES,
  AppNavLinkStatus,
} from '../../../src/core/public';
import {
  ExamplePlugin2PluginSetup,
  ExamplePlugin2PluginStart,
  AppPluginStartDependencies,
} from './types';
import { PLUGIN_NAME, PLUGIN_ID } from '../common';

export class ExamplePlugin2Plugin
  implements Plugin<ExamplePlugin2PluginSetup, ExamplePlugin2PluginStart> {
  public setup(core: CoreSetup): ExamplePlugin2PluginSetup {
    // check if the plugin's manifest defined required engine plugins are installed on the cluster
    return this.getCompatibilityResult().then((result) => {
      const navStatus = result.status;
      // Register an application into the side navigation menu
      core.application.register({
        id: PLUGIN_ID,
        title: PLUGIN_NAME,
        defaultPath: '#/',
        category: DEFAULT_APP_CATEGORIES.opensearchDashboards,
        navLinkStatus: navStatus !== 'Enabled' ? AppNavLinkStatus.hidden : AppNavLinkStatus.visible,
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
          return i18n.translate('XCompat-plugin-example2.greetingText', {
            defaultMessage: 'Hello from Example plugin to demonstrate Cross compatiblity check!',
            values: {
              name: PLUGIN_NAME,
            },
          });
        },
      };
    });
  }

  async getCompatibilityResult() {
    try {
      // Make the fetch request to your plugin API endpoint
      const response = await fetch('/api/example_plugin_2/verify_crosscompatability');
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      // Handle errors
      throw new Error(`Error ${error}`);
    }
  }

  public start(core: CoreStart): ExamplePlugin2PluginStart {
    return {};
  }

  public stop() {}
}
