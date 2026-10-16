/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { schema } from '@osd/config-schema';

import { UiSettingsParams } from 'opensearch-dashboards/server';
import { UiSettingScope } from '../../../core/server';
import {
  DEFAULT_TRACE_COLUMNS_SETTING,
  DEFAULT_LOGS_COLUMNS_SETTING,
  ENABLE_EXPERIMENTAL_SETTING,
  LOGS_BUILDER_MODE_ONLY_SETTING,
  ASYNC_QUERY_POLL_INTERVAL_SETTING,
  FORMAT_JSON_SETTING,
  ROW_SEPARATORS_SETTING,
} from '../common';

export const exploreUiSettings: Record<string, UiSettingsParams> = {
  [ASYNC_QUERY_POLL_INTERVAL_SETTING]: {
    name: i18n.translate('explore.advancedSettings.asyncQueryPollIntervalTitle', {
      defaultMessage: 'Async query poll interval',
    }),
    value: 5000,
    description: i18n.translate('explore.advancedSettings.asyncQueryPollIntervalText', {
      defaultMessage:
        'Milliseconds between status checks for queries that run asynchronously. Lower values ' +
        'show partial results sooner at the cost of more requests.',
    }),
    category: ['explore'],
    schema: schema.number({ min: 250, max: 60000 }),
  },
  [FORMAT_JSON_SETTING]: {
    name: i18n.translate('explore.advancedSettings.formatJsonValuesTitle', {
      defaultMessage: 'Format JSON values',
    }),
    value: true,
    description: i18n.translate('explore.advancedSettings.formatJsonValuesText', {
      defaultMessage:
        'Show string values that contain a JSON object or array as a collapsible, highlighted ' +
        'tree in the Explore results table and in expanded documents. Rows showing a tree also ' +
        'put the date and the time of the time column on separate lines. Each user can ' +
        'override this from the table settings.',
    }),
    category: ['explore'],
    schema: schema.boolean(),
  },
  [ROW_SEPARATORS_SETTING]: {
    name: i18n.translate('explore.advancedSettings.rowSeparatorsTitle', {
      defaultMessage: 'Show row separators',
    }),
    value: false,
    description: i18n.translate('explore.advancedSettings.rowSeparatorsText', {
      defaultMessage: 'Draw a thin line between the rows of the Explore results table.',
    }),
    category: ['explore'],
    schema: schema.boolean(),
  },
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
  [LOGS_BUILDER_MODE_ONLY_SETTING]: {
    name: i18n.translate('explore.advancedSettings.logsBuilderModeOnlyTitle', {
      defaultMessage: 'Restrict to logs query builder mode',
    }),
    value: false,
    description: i18n.translate('explore.advancedSettings.logsBuilderModeOnlyText', {
      defaultMessage:
        'Allow only the visual builder in the Explore logs query editor. ' +
        'Code editing and AI-generated queries are disabled.',
    }),
    category: ['explore'],
    scope: UiSettingScope.WORKSPACE,
    requiresCapability: 'explore.logsQueryBuilderEnabled',
    schema: schema.boolean(),
  },
};
