/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { schema } from '@osd/config-schema';

import { UiSettingsParams } from 'opensearch-dashboards/server';
import { QUERY_ASSIST_DISABLED } from '../common';

export const uiSettings: Record<string, UiSettingsParams> = {
  [QUERY_ASSIST_DISABLED]: {
    name: i18n.translate('queryEnhancements.advancedSettings.queryAssistDisabledTitle', {
      defaultMessage: 'Disable experimental query assist in the search bar',
    }),
    value: false,
    description: i18n.translate('queryEnhancements.advancedSettings.queryAssistDisabledText', {
      defaultMessage: `If the query assist is setup and enabled, the query bar will provide suggestions and auto-completions as you type. 
        This is an experimental feature and may not work as expected. If you encounter issues, you can disable it here.`,
    }),
    category: ['search'],
    schema: schema.boolean(),
  },
};
