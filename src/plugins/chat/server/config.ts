/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema, TypeOf } from '@osd/config-schema';

export const configSchema = schema.object({
  enabled: schema.boolean({ defaultValue: false }),
  agUiUrl: schema.maybe(schema.string()),
  mlCommonsAgentId: schema.maybe(schema.string()),
  observabilityAgentId: schema.maybe(schema.string()),
  maxFileUploadBytes: schema.number({ defaultValue: 3145728, min: 1 }), // 3MB default
  maxFileAttachments: schema.number({ defaultValue: 10, min: 1, max: 50 }),
});

export type ChatConfigType = TypeOf<typeof configSchema>;
