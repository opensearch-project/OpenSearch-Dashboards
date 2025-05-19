/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { UiSettingScope, UiSettingsParams } from '../types';

const ENABLE_DASHBOARD_ASSISTANT_FEATURE = 'enableDashboardAssistantFeature';

export const uiSettingWithPermission: Record<string, UiSettingsParams> = {
  [ENABLE_DASHBOARD_ASSISTANT_FEATURE]: {
    name: 'Enable dashboard assistant plugin features',
    value: true,
    description: 'Enable dashboard assistant plugin features',
    scope: UiSettingScope.DASHBOARD_ADMIN,
    schema: schema.boolean(),
  },
};
