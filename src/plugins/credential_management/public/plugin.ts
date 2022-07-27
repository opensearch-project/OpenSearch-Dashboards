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

import { i18n } from '@osd/i18n';
import { DataPublicPluginStart } from 'src/plugins/data/public';

import { CoreSetup, CoreStart, Plugin } from '../../../core/public';

import { ManagementSetup } from '../../management/public';
import { UrlForwardingSetup } from '../../url_forwarding/public';

import {
  CredentialManagementService,
  CredentialManagementServiceSetup,
  CredentialManagementServiceStart,
} from './service';

export interface CredentialManagementSetupDependencies {
  management: ManagementSetup;
  urlForwarding: UrlForwardingSetup;
}

export interface CredentialManagementStartDependencies {
  data: DataPublicPluginStart;
}

export type CredentialManagementSetup = CredentialManagementServiceSetup;

export type CredentialManagementStart = CredentialManagementServiceStart;

const sectionsHeader = i18n.translate('credentialManagement.credential.sectionsHeader', {
  defaultMessage: 'Credentials',
});

const CM_APP_ID = 'credentials';

export class CredentialManagementPlugin
  implements
    Plugin<
      CredentialManagementSetup,
      CredentialManagementStart,
      CredentialManagementSetupDependencies,
      CredentialManagementStartDependencies
    > {
  private readonly credentialManagementService = new CredentialManagementService();
  public setup(
    core: CoreSetup<CredentialManagementStartDependencies, CredentialManagementStart>,
    { management }: CredentialManagementSetupDependencies
  ) {
    const opensearchDashboardsSection = management.sections.section.opensearchDashboards;

    if (!opensearchDashboardsSection) {
      throw new Error('`opensearchDashboards` management section not found.');
    }

    opensearchDashboardsSection.registerApp({
      id: CM_APP_ID,
      title: sectionsHeader,
      order: 0,
      mount: async (params) => {
        const { mountManagementSection } = await import('./management_app');

        return mountManagementSection(core.getStartServices, params);
      },
    });

    return this.credentialManagementService.setup({ httpClient: core.http });
  }

  public start(core: CoreStart, plugins: CredentialManagementStartDependencies) {
    return this.credentialManagementService.start();
  }

  public stop() {}
}
