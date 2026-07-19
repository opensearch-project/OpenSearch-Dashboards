/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { schema } from '@osd/config-schema';

import { UiSettingsParams } from 'opensearch-dashboards/server';
import {
  DEFAULT_TRACE_COLUMNS_SETTING,
  DEFAULT_LOGS_COLUMNS_SETTING,
  ENABLE_EXPERIMENTAL_SETTING,
  ENABLE_LOGS_QUERY_BUILDER_SETTING,
} from '../common';

export const exploreUiSettings: Record<string, UiSettingsParams> = {
  [DEFAULT_TRACE_COLUMNS_SETTING]: {
    name: i18n.translate('explore.advancedSettings.defaultTraceColumnsTitle', {
      defaultMessage: 'Default trace columns',
    }),
    value: [
      'spanId',
      'status.code',
      'attributes.http.status_code',
      'resource.attributes.service.name',
      'kind',
      'name',
      'durationNano',
      'durationInNanos',
    ],
    description: i18n.translate('explore.advancedSettings.defaultTraceColumnsText', {
      defaultMessage: 'Experimental: Columns displayed by default in the Explore traces tab',
    }),
    category: ['explore'],
    schema: schema.arrayOf(schema.string()),
  },
  [DEFAULT_LOGS_COLUMNS_SETTING]: {
    name: i18n.translate('explore.advancedSettings.defaultLogsColumnsTitle', {
      defaultMessage: 'Default logs columns',
    }),
    value: ['body', 'severityText', 'resource.attributes.service.name'],
    description: i18n.translate('explore.advancedSettings.defaultLogsColumnsText', {
      defaultMessage: 'Columns displayed by default in the Explore logs tab',
    }),
    category: ['explore'],
    schema: schema.arrayOf(schema.string()),
  },
  [ENABLE_EXPERIMENTAL_SETTING]: {
    name: i18n.translate('explore.advancedSettings.enableExperimentalTitle', {
      defaultMessage: 'Enable experimental features',
    }),
    value: false,
    description: i18n.translate('explore.advancedSettings.enableExperimentalText', {
      defaultMessage:
        'Enable experimental features in Explore including field statistics and histogram breakdown selector.',
    }),
    category: ['explore'],
    schema: schema.boolean(),
  },
};

// Registered only when the logsQueryBuilder server config is enabled, so the setting
// stays hidden from Advanced Settings when the feature is turned off server-side.
export const exploreLogsQueryBuilderUiSetting: Record<string, UiSettingsParams> = {
  [ENABLE_LOGS_QUERY_BUILDER_SETTING]: {
    name: i18n.translate('explore.advancedSettings.enableLogsQueryBuilderTitle', {
      defaultMessage: 'Enable logs query builder',
    }),
    value: true,
    description: i18n.translate('explore.advancedSettings.enableLogsQueryBuilderText', {
      defaultMessage: 'Enable the visual query builder in the Explore logs tab.',
    }),
    category: ['explore'],
    schema: schema.boolean(),
  },
};
