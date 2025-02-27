import { AppMountParameters, CoreSetup, CoreStart, Plugin } from '../../../core/public';
import {
  DataUploaderPluginSetup,
  DataUploaderPluginStart,
  AppPluginStartDependencies,
} from './types';
import { PLUGIN_NAME } from '../common';

export class DataUploaderPlugin
  implements Plugin<DataUploaderPluginSetup, DataUploaderPluginStart> {
  public setup(core: CoreSetup): DataUploaderPluginSetup {
    // Register an application into the side navigation menu
    core.application.register({
      id: 'dataUploader',
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

    // Return an empty object as no methods are exposed to other plugins
    return {};
  }

  public start(core: CoreStart): DataUploaderPluginStart {
    return {};
  }

  public stop() {}
}
