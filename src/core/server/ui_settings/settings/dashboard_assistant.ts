/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { UiSettingScope, UiSettingsParams } from '../types';

const ENABLE_DASHBOARD_ASSISTANT_FEATURE = 'enableDashboardAssistantFeature';

export const getDashboardAssistantSettings = (): Record<string, UiSettingsParams> => {
  return {
    [ENABLE_DASHBOARD_ASSISTANT_FEATURE]: {
      name: 'Enable dashboard assistant',
      value: true,
      description: 'Enable dashboard assistant plugin features',
      requiresPageReload: true,
      scope: UiSettingScope.DASHBOARD_ADMIN,
      schema: schema.boolean(),
    },
  };
};
