/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema, TypeOf } from '@osd/config-schema';
import { CSV_FILE_TYPE, JSON_FILE_TYPE, NDJSON_FILE_TYPE } from './common/constants';

export const configSchema = schema.object({
  enabled: schema.boolean({ defaultValue: false }),
  enabledFileTypes: schema.arrayOf(schema.string(), {
    defaultValue: [CSV_FILE_TYPE, JSON_FILE_TYPE, NDJSON_FILE_TYPE],
  }),
  maxFileSizeBytes: schema.number({
    defaultValue: 100000000,
    min: 1,
  }),
  maxTextCount: schema.number({
    defaultValue: 10000,
    min: 1,
  }),
  filePreviewDocumentsCount: schema.number({
    defaultValue: 10,
    min: 1,
  }),
});

export type ConfigSchema = TypeOf<typeof configSchema>;
export type PublicConfigSchema = Omit<ConfigSchema, 'enabled'>;
