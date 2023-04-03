/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { CoreSetup, CoreStart, Plugin } from '../../../core/public';
import { PointInTimeManagementPluginSetup, PointInTimeManagementPluginStart } from './types';
import { ManagementSetup } from '../../management/public';

export interface PointInTimeManagementSetupDependencies {
  management: ManagementSetup;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PointInTimeManagementStartDependencies {}

const sectionsHeader = i18n.translate('pointInTimeManagement.pointInTime.sectionsHeader', {
  defaultMessage: 'Point In Time',
});

const PITM_APP_ID = 'pointInTime';

export class PointInTimeManagementPlugin
  implements
    Plugin<
      PointInTimeManagementPluginSetup,
      PointInTimeManagementPluginStart,
      PointInTimeManagementSetupDependencies,
      PointInTimeManagementStartDependencies
    > {
  public setup(
    core: CoreSetup<PointInTimeManagementStartDependencies, PointInTimeManagementPluginStart>,
    { management }: PointInTimeManagementSetupDependencies
  ): PointInTimeManagementPluginSetup {
    const opensearchDashboardsSection = management.sections.section.opensearchDashboards;

    if (!opensearchDashboardsSection) {
      throw new Error('`opensearchDashboards` management section not found.');
    }

    opensearchDashboardsSection.registerApp({
      id: PITM_APP_ID,
      title: sectionsHeader,
      order: 1,
      mount: async (mountParams) => {
        const { mountManagementSection } = await import('./management_app');
        return mountManagementSection(core.getStartServices, mountParams);
      },
    });

    return {};
  }

  public start(core: CoreStart): PointInTimeManagementPluginStart {
    return {};
  }

  public stop() {}
}
