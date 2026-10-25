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
  STREAMING_RESULTS_SETTING,
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
  [STREAMING_RESULTS_SETTING]: {
    name: i18n.translate('explore.advancedSettings.enableStreamingResultsTitle', {
      defaultMessage: 'Stream results for long-running queries',
    }),
    value: false,
    description: i18n.translate('explore.advancedSettings.enableStreamingResultsText', {
      defaultMessage:
        'Deliver PPL results progressively instead of waiting for the query to finish. Rows appear ' +
        'as the engine commits them, with a live count of rows found and the option to stop the ' +
        'query. Only queries whose plan can expose a stable row prefix stream this way; a query ' +
        'that sorts or aggregates still returns everything at once, because its intermediate rows ' +
        'could be revised.',
    }),
    category: ['explore'],
    schema: schema.boolean(),
  },
};
