/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { schema } from '@osd/config-schema';

import { UiSettingsParams } from 'opensearch-dashboards/server';
import { DEFAULT_TRACE_COLUMNS_SETTING, ENABLE_EXPERIMENTAL_SETTING } from '../common';

export const exploreUiSettings: Record<string, UiSettingsParams> = {
  [DEFAULT_TRACE_COLUMNS_SETTING]: {
    name: i18n.translate('explore.advancedSettings.defaultTraceColumnsTitle', {
      defaultMessage: 'Default trace columns',
    }),
    value: [
      'spanId',
      'spanID',
      'status.code',
      'tag.error', // Jaeger error indicator
      'attributes.http.status_code',
      'attributes.rpc.grpc.status_code', // DataPrepper gRPC status code
      'tags', // Jaeger tags array (contains http.status_code)
      'rpc.grpc.status_code', // Jaeger gRPC status code
      'resource.attributes.service.name',
      'process.serviceName',
      'kind',
      'tag.span@kind', // Jaeger span kind (server/client/etc.)
      'tag', // Jaeger tag object (contains span@kind)
      'name',
      'operationName',
      'durationNano',
      'durationInNanos',
      'duration',
    ],
    description: i18n.translate('explore.advancedSettings.defaultTraceColumnsText', {
      defaultMessage: 'Experimental: Columns displayed by default in the Explore traces tab',
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
