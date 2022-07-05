/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

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
  
  public setup (
    core: CoreSetup<CredentialManagementStartDependencies>,
    { management, urlForwarding}: CredentialManagementSetupDependencies
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
  }

  public start(core: CoreStart): CredentialManagementPluginStart {
    return {};
  }

  public stop() {}
}
