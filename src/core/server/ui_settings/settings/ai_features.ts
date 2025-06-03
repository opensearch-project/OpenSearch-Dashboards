/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { i18n } from '@osd/i18n';
import { UiSettingScope, UiSettingsParams } from '../types';
import { ENABLE_AI_FEATURES } from '../../../../core/utils/constants';

export const getAIFeaturesSetting = (): Record<string, UiSettingsParams> => {
  return {
    [ENABLE_AI_FEATURES]: {
      name: i18n.translate('core.ui_settings.params.enableAIFeaturesTitle', {
        defaultMessage: 'Enable AI features',
      }),
      value: true,
      description: i18n.translate('core.ui_settings.params.enableAIFeaturesText', {
        defaultMessage: 'The setting to enable all AI-powered features in OpenSearch Dashboards.',
      }),
      requiresPageReload: true,
      scope: UiSettingScope.DASHBOARD_ADMIN,
      schema: schema.boolean(),
    },
  };
};
