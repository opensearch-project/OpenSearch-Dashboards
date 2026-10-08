/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { i18n } from '@osd/i18n';
import { UiSettingScope, UiSettingsParams } from '../types';
import { ENABLE_GLOBAL_SETTING_CONTROL } from '../../../../core/utils/constants';

export const getGlobalSettingControlSetting = (): Record<string, UiSettingsParams> => {
  return {
    [ENABLE_GLOBAL_SETTING_CONTROL]: {
      name: i18n.translate('core.ui_settings.params.enableGlobalSettingControlTitle', {
        defaultMessage: 'Restrict global settings to admins',
      }),
      value: false,
      description: i18n.translate('core.ui_settings.params.enableGlobalSettingControlText', {
        defaultMessage:
          'When enabled, only dashboard admins can edit global settings. All other users will see global settings as read-only.',
      }),
      requiresPageReload: true,
      scope: UiSettingScope.DASHBOARD_ADMIN,
      category: ['admin'],
      schema: schema.boolean(),
    },
  };
};
