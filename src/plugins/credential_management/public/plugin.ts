/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

import { CoreSetup, CoreStart, Plugin } from '../../../core/public';
import { CredentialManagementSetupDependencies } from './types';

const sectionsHeader = i18n.translate('credentialManagement.credential.sectionsHeader', {
  defaultMessage: 'Credentials',
});

const CM_APP_ID = 'credentials';

export class CredentialManagementPlugin
  implements Plugin<void, void, CredentialManagementSetupDependencies> {
  public setup(core: CoreSetup, { management }: CredentialManagementSetupDependencies) {
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
  }

  public start(core: CoreStart) {}

  public stop() {}
}
