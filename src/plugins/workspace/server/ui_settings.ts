/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';

import { UiSettingsParams } from 'opensearch-dashboards/server';
import { DEFAULT_WORKSPACE } from '../common/constants';

export const uiSettings: Record<string, UiSettingsParams> = {
  [DEFAULT_WORKSPACE]: {
    name: 'Default workspace',
    scope: 'user',
    value: null,
    type: 'string',
    schema: schema.nullable(schema.string()),
  },
};
