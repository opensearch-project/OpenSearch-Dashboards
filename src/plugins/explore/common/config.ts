/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema, TypeOf } from '@osd/config-schema';
import { DEFAULT_DATA } from '../../data/common';

export const configSchema = schema.object({
  enabled: schema.boolean({ defaultValue: false }),
  supportedTypes: schema.arrayOf(schema.string(), {
    defaultValue: [DEFAULT_DATA.SET_TYPES.INDEX, DEFAULT_DATA.SET_TYPES.INDEX_PATTERN],
  }),
});

export type ConfigSchema = TypeOf<typeof configSchema>;
