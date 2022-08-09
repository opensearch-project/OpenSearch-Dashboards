import { i18n } from '@osd/i18n';
import { PluginInitializerContext } from 'opensearch-dashboards/server';
import { AppMountParameters, CoreSetup, CoreStart, Plugin } from '../../../core/public';
import { BrandingPluginSetup, BrandingPluginStart, AppPluginStartDependencies } from './types';
import { PLUGIN_NAME } from '../common';
import { ConfigSchema } from '../config';
import { BrandingAssignment } from './services';

export class BrandingPlugin implements Plugin<BrandingPluginSetup, BrandingPluginStart> {
  private readonly brandingAssignment = new BrandingAssignment();

  constructor(private readonly initializerContext: PluginInitializerContext<ConfigSchema>) {}

  public setup(core: CoreSetup): BrandingPluginSetup {
    // Register an application into the side navigation menu
    core.application.register({
      id: 'branding',
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
        return i18n.translate('branding.greetingText', {
          defaultMessage: 'Hello from {name}!',
          values: {
            name: PLUGIN_NAME,
          },
        });
      },
    };
  }

  public start(core: CoreStart): BrandingPluginStart {
    return {};
  }

  public stop() {}
}
