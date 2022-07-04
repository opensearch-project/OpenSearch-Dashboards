// import { i18n } from '@osd/i18n';
import { DataPublicPluginStart } from 'src/plugins/data/public';

import { AppMountParameters, CoreSetup, CoreStart, Plugin } from '../../../core/public';
import {
  CredentialManagementPluginSetup,
  CredentialManagementPluginStart,
  AppPluginStartDependencies,
} from './types';
import { PLUGIN_NAME } from '../common';

import { ManagementSetup } from '../../management/public';
import { UrlForwardingSetup } from '../../url_forwarding/public';

import { CredentialManagementService } from './service';

export interface CredentialManagementSetupDependencies {
  management: ManagementSetup;
  urlForwarding: UrlForwardingSetup;
}

export interface CredentialManagementStartDependencies {
  data: DataPublicPluginStart;
}

export class CredentialManagementPlugin
  implements Plugin<CredentialManagementPluginSetup, CredentialManagementPluginStart> {
  
  private readonly credentialManagementService = new CredentialManagementService();  
    
  public setup(
    core: CoreSetup<CredentialManagementStartDependencies>,
    { management, urlForwarding}: CredentialManagementSetupDependencies,
  ): CredentialManagementPluginSetup {
    const opensearchDashboardsSection = management.sections.section.opensearchDashboards;
    
    if (!opensearchDashboardsSection) {
      throw new Error('`opensearchDashboards` management section not found.');
    }

    opensearchDashboardsSection.registerApp({
      id: 'credentialManagement',
      title: PLUGIN_NAME,
      order: 0,
      mount: async (params) => {
        const { mountManagementSection } = await import('./management_app');

        return mountManagementSection(core.getStartServices, params);
      },
    });

    return this.credentialManagementService.setup({ httpClient: core.http });

    // Register an application into the side navigation menu
    // core.application.register({
    //   id: 'credentialManagement',
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
    // return {
    //   getGreeting() {
    //     return i18n.translate('credentialManagement.greetingText', {
    //       defaultMessage: 'Hello from {name}!',
    //       values: {
    //         name: PLUGIN_NAME,
    //       },
    //     });
    //   },
    // };
  }

  public start(core: CoreStart): CredentialManagementPluginStart {
    return {};
  }

  public stop() {}
}
