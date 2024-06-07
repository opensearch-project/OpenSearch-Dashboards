/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { schema } from '@osd/config-schema';

import { UiSettingsParams } from 'opensearch-dashboards/server';
import { QUERY_ENABLE_ENHANCEMENTS_SETTING } from '../common';

export const uiSettings: Record<string, UiSettingsParams> = {
  [QUERY_ENABLE_ENHANCEMENTS_SETTING]: {
    name: i18n.translate('queryEnhancements.advancedSettings.enableTitle', {
      defaultMessage: 'Enable experimental query enhancements',
    }),
    value: true,
    description: i18n.translate('queryEnhancements.advancedSettings.enableText', {
      defaultMessage: `Allows users to query data using enhancements where available. If disabled,
        only querying and querying languages that are considered production-ready are available to the user.`,
    }),
    category: ['search'],
    schema: schema.boolean(),
  },
};
