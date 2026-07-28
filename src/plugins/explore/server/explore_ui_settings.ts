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
  PARTIAL_RESULTS_SETTING,
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
  [PARTIAL_RESULTS_SETTING]: {
    name: i18n.translate('explore.advancedSettings.enablePartialResultsTitle', {
      defaultMessage: 'Return partial results on mapping conflicts',
    }),
    value: false,
    description: i18n.translate('explore.advancedSettings.enablePartialResultsText', {
      defaultMessage:
        'When a field is mapped inconsistently across indices (e.g. text in some, keyword in ' +
        'others), an aggregation on that field normally fails. When enabled, the aggregation runs ' +
        'over the indices where the field is aggregatable and the result is returned with a ' +
        'warning naming the excluded indices, instead of failing the query.',
    }),
    category: ['explore'],
    schema: schema.boolean(),
  },
};
